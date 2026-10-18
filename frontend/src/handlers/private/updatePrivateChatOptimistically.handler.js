export const updatePrivateChatOptimistically = (
  privateChats,
  setPrivateChats,
  otherUser,
  messageContent
) => {
  setPrivateChats(prev => {
    const list = Array.isArray(prev) ? prev : [];
    const chatIndex = list.findIndex(c => c.otherUser.id === otherUser.id);
    if (chatIndex !== -1) {
      const updated = [...list];
      const [existing] = updated.splice(chatIndex, 1);
      return [
        {
          ...existing,
          otherUser: { ...existing.otherUser, ...otherUser },
          lastMessage: { content: messageContent, timestamp: new Date() },
        },
        ...updated,
      ];
    }
    return [
      { otherUser, lastMessage: { content: messageContent, timestamp: new Date() } },
      ...list,
    ];
  });
};
