export const updatePrivateChatOptimistically = (
  privateChats,
  setPrivateChats,
  otherUser,
  messageContent
) => {
  setPrivateChats(prev => {
    const chatIndex = prev.findIndex(c => c.otherUser.id === otherUser.id);
    if (chatIndex !== -1) {
      const updated = [...prev];
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
      ...prev,
    ];
  });
};
