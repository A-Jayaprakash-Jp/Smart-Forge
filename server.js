import express from 'express';
import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
import cors from 'cors';

// Load environment variables from .env file
dotenv.config();

const app = express();
const port = process.env.PORT || 3001;
const DB_NAME = 'smart_forge';

// Middleware
app.use(cors()); // Allow cross-origin requests from the frontend
app.use(express.json({ limit: '50mb' })); // To parse JSON bodies, increase limit for images

// Get the MongoDB connection string from your .env file
const uri = process.env.MONGO_URI;
if (!uri) {
  console.error('MONGO_URI is not defined in the .env file. The server cannot connect to the database.');
  process.exit(1);
}

// Create a new MongoClient
const client = new MongoClient(uri);

async function main() {
  try {
    // Connect the client to the server
    await client.connect();
    console.log("Successfully connected to MongoDB!");

    const db = client.db(DB_NAME);
    console.log(`Connected to database: ${DB_NAME}`);

    // === API Endpoints ===

    // This single endpoint fetches all the necessary data for the app's initial load.
    // It mirrors the structure of the mock data to ensure a seamless transition.
    app.get('/api/data', async (req, res) => {
        console.log("GET /api/data - Fetching initial application data...");
        try {
            const collections = [
                'production_logs', 'downtime_events', 'machines', 'maintenance_tasks',
                'maintenance_requests', 'machine_alerts', 'production_orders', 'inventory_items',
                'shifts', 'incident_logs', 'breakdown_reports', 'safety_permits',
                'layout_inspections', 'quality_documents', 'machine_programs', 'tools',
                'projects', 'predictive_alerts', 'tool_usage_logs'
            ];

            const promises = collections.map(c => db.collection(c).find({}).toArray());
            const [
                productionLogs, downtimeEvents, machines, maintenanceTasks,
                maintenanceRequests, machineAlerts, productionOrders, inventoryItems,
                shifts, incidentLogs, breakdownReports, safetyPermits,
                layout_inspections, qualityDocuments, machinePrograms, tools,
                projects, predictiveAlerts, toolUsageLogs
            ] = await Promise.all(promises);

            res.json({
                productionData: { logs: productionLogs, downtime: downtimeEvents },
                machines,
                maintenanceTasks,
                maintenanceRequests,
                machineAlerts,
                productionOrders,
                inventoryItems,
                shifts,
                incidentLogs,
                breakdownReports,
                safetyPermits,
                layout_inspections,
                qualityDocuments,
                machinePrograms,
                tools,
                projects,
                predictiveAlerts,
                toolUsageLogs,
            });
            console.log("GET /api/data - Successfully sent initial data.");

        } catch (err) {
            console.error("Error fetching initial data from MongoDB:", err);
            res.status(500).send({ message: "Error fetching initial application data", error: err });
        }
    });

    // This endpoint receives the offline sync queue from the client and processes it.
    app.post('/api/sync', async (req, res) => {
        const queue = req.body;
        console.log(`POST /api/sync - Received ${queue.length} items to sync.`);
        if (!Array.isArray(queue)) {
            return res.status(400).json({ success: false, message: 'Invalid sync queue format.' });
        }
        
        try {
            for (const item of queue) {
                // Sanitize payload dates before insertion, as they come in as strings
                if (item.payload.timestamp) item.payload.timestamp = new Date(item.payload.timestamp);
                if (item.payload.start) item.payload.start = new Date(item.payload.start);
                if (item.payload.end) item.payload.end = new Date(item.payload.end);
                if (item.payload.reviewTimestamp) item.payload.reviewTimestamp = new Date(item.payload.reviewTimestamp);
                if (item.payload.reportedDate) item.payload.reportedDate = new Date(item.payload.reportedDate);
                if (item.payload.assignedAt) item.payload.assignedAt = new Date(item.payload.assignedAt);
                if (item.payload.completedAt) item.payload.completedAt = new Date(item.payload.completedAt);
                if (item.payload.reportTimestamp) item.payload.reportTimestamp = new Date(item.payload.reportTimestamp);
                if (item.payload.issueTimestamp) item.payload.issueTimestamp = new Date(item.payload.issueTimestamp);

                console.log(`- Processing action: ${item.action} for entity: ${item.entityId || 'multiple'}`);

                switch (item.action) {
                    case 'ADD_PRODUCTION_LOG':
                        await db.collection('production_logs').insertOne(item.payload);
                        break;
                    case 'ADD_MULTIPLE_PRODUCTION_LOGS':
                         if (Array.isArray(item.payload) && item.payload.length > 0) {
                            const logsToInsert = item.payload.map(log => ({
                                ...log,
                                timestamp: new Date(log.timestamp)
                            }));
                            await db.collection('production_logs').insertMany(logsToInsert);
                        }
                        break;
                    case 'APPROVE_PRODUCTION_LOG':
                        await db.collection('production_logs').updateOne({ id: item.payload.logId }, { $set: { status: 'Approved', reviewedByUserId: item.payload.reviewerId, reviewTimestamp: new Date() } });
                        break;
                    case 'REJECT_PRODUCTION_LOG':
                         await db.collection('production_logs').updateOne({ id: item.payload.logId }, { $set: { status: 'Rejected', reviewedByUserId: item.payload.reviewerId, reviewTimestamp: new Date(), rejectionNotes: item.payload.notes } });
                        break;
                    case 'UPDATE_PRODUCTION_LOG':
                         await db.collection('production_logs').updateOne({ id: item.payload.id }, { $set: item.payload });
                        break;
                    case 'START_DOWNTIME':
                        await db.collection('downtime_events').insertOne(item.payload);
                        break;
                    case 'END_DOWNTIME':
                        await db.collection('downtime_events').updateOne({ id: item.payload.id }, { $set: { end: item.payload.end } });
                        break;
                    case 'ADD_INCIDENT_LOG':
                        await db.collection('incident_logs').insertOne(item.payload);
                        break;
                    case 'ADD_MAINTENANCE_REQUEST':
                         await db.collection('maintenance_requests').insertOne(item.payload);
                        break;
                    case 'UPDATE_ASSIGNED_TASK_STATUS':
                        const taskToUpdate = item.payload.find((t) => t.id === item.entityId);
                        if(taskToUpdate) {
                            await db.collection('assigned_tasks').updateOne({ id: item.entityId }, { $set: { isCompleted: taskToUpdate.isCompleted, completedAt: taskToUpdate.completedAt ? new Date(taskToUpdate.completedAt) : null }});
                        }
                        break;
                    default:
                        console.log(`- Skipping unhandled sync action: ${item.action}`);
                }
            }
            console.log(`POST /api/sync - Successfully processed ${queue.length} items.`);
            res.status(200).json({ success: true, message: `Successfully processed ${queue.length} items.` });
        } catch (err) {
            console.error("Error during sync operation:", err);
            res.status(500).json({ success: false, message: 'An error occurred during sync.', error: err.message });
        }
    });


    // Start the API server
    app.listen(port, () => {
      console.log(`Backend server listening at http://localhost:${port}`);
    });

  } catch (e) {
    console.error("Failed to connect to MongoDB and start the server", e);
    await client.close();
    process.exit(1);
  }
}

// Run the main function to connect and start the server
main().catch(console.error);

// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('Shutting down server and disconnecting from MongoDB...');
    await client.close();
    process.exit(0);
});