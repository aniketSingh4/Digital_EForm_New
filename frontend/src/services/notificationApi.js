import api from "./api";

export const mapServerNotification = (notification) => {
    const eventType = notification?.type || "";
    const normalized = String(eventType).toUpperCase();
    const isError = normalized.includes("ERROR") || normalized.includes("FAILED");
    const isWarning = normalized.includes("WARNING");
    let type = "success";
    if (isError) type = "error";
    else if (isWarning) type = "warning";
    else if (!normalized.startsWith("REPORT_")) type = "info";

    return {
        id: String(notification.id),
        serverId: notification.id,
        timestamp: notification.createdAt,
        read: !!notification.read,
        type,
        eventType: notification.type,
        audience: notification.audience,
        recipientEmail: notification.recipientEmail,
        actorName: notification.actorName,
        actorEmail: notification.actorEmail,
        text: notification.summary,
        summary: notification.summary,
        reportType: notification.reportType,
        reportTitle: notification.reportTitle,
        reportId: notification.reportId,
        persisted: true,
        localOnly: false,
    };
};

const notificationApi = {
    list: async () => {
        const response = await api.get("/notifications");
        return response.data;
    },

    create: async (payload) => {
        const response = await api.post("/notifications", payload);
        return response.data;
    },

    markRead: async (id) => {
        const response = await api.patch(`/notifications/${id}/read`);
        return response.data;
    },

    markAllRead: async () => {
        await api.post("/notifications/read-all");
    },

    delete: async (id) => {
        await api.delete(`/notifications/${id}`);
    },

    clearAll: async () => {
        await api.delete("/notifications");
    },
};

export default notificationApi;
