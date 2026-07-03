class TrieNode {
  constructor() {
    this.children = new Map();
    this.roomIds = new Set(); 
  }
}

class RoomTrie {
  constructor() {
    this.root = new TrieNode();
  }

  insert(text, roomId) {
    text=text?.trim();
    if (!text) return;
    let node = this.root;
    const normalized = text.toLowerCase();
    for (const ch of normalized) {
      if (!node.children.has(ch)) node.children.set(ch, new TrieNode());
      node = node.children.get(ch);
      node.roomIds.add(roomId);
    }
  }

  remove(text, roomId) {
    text=text?.trim();
    if (!text) return;
    let node = this.root;
    const normalized = text.toLowerCase();
    for (const ch of normalized) {
      node = node.children.get(ch);
      if (!node) return;
      node.roomIds.delete(roomId);
    }
  }

  search(prefix) {
    prefix=prefix?.trim();
    
    let node = this.root;
    const normalized = prefix.toLowerCase();
    for (const ch of normalized) {
      node = node.children.get(ch);
      if (!node) return new Set();
    }
    return node.roomIds;
  }
}

export default RoomTrie;