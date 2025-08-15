import { useProductionData } from './useProductionData';
import { useMessagingData } from './useMessagingData';
import { useMemo } from 'react';

export const useIsPendingSync = (entityId?: string) => {
    const { syncQueue: prodQueue, syncStatus: prodSyncStatus } = useProductionData();
    const { syncQueue: msgQueue, syncStatus: msgSyncStatus } = useMessagingData();

    const isPending = useMemo(() => {
        if (!entityId || (prodSyncStatus === 'synced' && msgSyncStatus === 'synced')) {
            return false;
        }

        const isInProdQueue = prodQueue.some(item => item.entityId === entityId);
        const isInMsgQueue = msgQueue.some(item => item.entityId === entityId);

        return isInProdQueue || isInMsgQueue;
    }, [entityId, prodQueue, msgQueue, prodSyncStatus, msgSyncStatus]);
    
    return isPending;
};