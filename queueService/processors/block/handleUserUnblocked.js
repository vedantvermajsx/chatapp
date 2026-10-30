import Block from '../../models/block.model.js';

export async function handleUserUnblocked({ blockerId, blockedId }) {
  await Block.deleteOne({ blockerId, blockedId });
}
