import express from 'express';
import roomCacheService from '../services/roomCacheService.js';

const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const { id, data } = req.body;
    if (!id || !data) {
      return res.status(400).json({ error: 'id and data are required' });
    }
    await roomCacheService.addRoomToCache(id, data);
    res.status(201).json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/', async (req, res) => {
  try {
    const { search = '' } = req.query;
    const rooms = await roomCacheService.getAllRooms({ search });
    res.json(rooms);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const room = await roomCacheService.getRoomById(id);
    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }
    res.json(room);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/name/:name', async (req, res) => {
  try {
    const { name } = req.params;
    const room = await roomCacheService.getRoomByName(name);
    res.json(room); 
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const rooms = await roomCacheService.getRoomsByUserId(userId);
    res.json(rooms);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id/members', async (req, res) => {
  try {
    const { id } = req.params;
    const skip = parseInt(req.query.skip, 10) || 0;
    const limit = parseInt(req.query.limit, 10) || 20;

    const result = await roomCacheService.getRoomMembers(id, { skip, limit });
    if (result === null) {
      return res.status(404).json({ error: 'Room not found' });
    }
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/:id/invalidate-members', async (req, res) => {
  try {
    const { id } = req.params;
    const { maxMembers, pageSize } = req.body;
    await roomCacheService.invalidateRoomMembers(id, { maxMembers, pageSize });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await roomCacheService.deleteRoomCache(id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
