import { useEffect, useRef, useState, useCallback } from 'react';
import { Globe } from 'lucide-react';
import roomService from '../../../services/room.service';
import Room from './Room';
import Spinner from '../../common/Spinner';
import { useTheme } from '../../../contexts/ThemeContext';

const PAGE_SIZE = 20;

const GlobalRoomList = ({ currentRoom, handleJoinRoom, searchQuery = '', socket = null, isActive = true }) => {
  const { theme } = useTheme();
  const [rooms, setRooms] = useState([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [initialLoaded, setInitialLoaded] = useState(false);
  const loaderRef = useRef(null);
  const fetchingRef = useRef(false);
  const hasFetchedRef = useRef(false);
  const lastSearchQueryRef = useRef(searchQuery);

  const fetchPage = useCallback(async (pageNum, query, reset = false) => {
    if (fetchingRef.current) return;
    fetchingRef.current = true;
    setLoading(true);
    try {
      const res = await roomService.getAllRoomsPaginated(query, pageNum, PAGE_SIZE);
      const fetched = Array.isArray(res) ? res : res?.rooms ?? [];
      const more = Array.isArray(res) ? fetched.length === PAGE_SIZE : (res?.hasMore ?? fetched.length === PAGE_SIZE);
      setRooms(prev => reset ? fetched : [...prev, ...fetched]);
      setHasMore(more);
      setPage(pageNum + 1);
    } catch (err) {
      console.error('Failed to load global rooms', err);
    } finally {
      setLoading(false);
      fetchingRef.current = false;
    }
  }, []);


  useEffect(() => {
    if (!isActive) return;

    const searchChanged = lastSearchQueryRef.current !== searchQuery;
    if (hasFetchedRef.current && !searchChanged) return;

    lastSearchQueryRef.current = searchQuery;
    hasFetchedRef.current = true;

    setRooms([]);
    setPage(0);
    setHasMore(true);
    setInitialLoaded(false);
    fetchPage(0, searchQuery, true).then(() => setInitialLoaded(true));
  }, [isActive, searchQuery, fetchPage]);

  useEffect(() => {
    if (!socket) return;

    const handleRoomUpdated = (updatedRoom) => {
      const id = updatedRoom?._id || updatedRoom?.id;
      if (!id) return;
      setRooms(prev => prev.map(r => (r._id === id ? { ...r, ...updatedRoom } : r)));
    };

    const handleRoomDeleted = ({ roomId } = {}) => {
      if (!roomId) return;
      setRooms(prev => prev.filter(r => r._id !== roomId));
    };

    const handleNewRoom = (room) => {
      const id = room?._id || room?.id;
      if (!id) return;
      setRooms(prev => (prev.some(r => r._id === id) ? prev : [room, ...prev]));
    };

    socket.on('roomUpdated', handleRoomUpdated);
    socket.on('roomDeleted', handleRoomDeleted);
    socket.on('newRoom', handleNewRoom);

    return () => {
      socket.off('roomUpdated', handleRoomUpdated);
      socket.off('roomDeleted', handleRoomDeleted);
      socket.off('newRoom', handleNewRoom);
    };
  }, [socket]);


  useEffect(() => {
    const el = loaderRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading && initialLoaded && isActive) {
          fetchPage(page, searchQuery);
        }
      },
      { threshold: 0.1 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasMore, loading, page, searchQuery, fetchPage, initialLoaded, isActive]);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 font-bold text-xs md:text-sm mb-3 px-2" style={{ color: theme.otherUsernameColor }}>
        <Globe className="w-3 h-3 md:w-4 md:h-4" /> All Groups
      </div>

      <div className="space-y-2 md:space-y-3 flex-1">
        {!initialLoaded ? (
          <div className="p-4 md:p-8 flex justify-center">
            <Spinner />
          </div>
        ) : rooms.length === 0 ? (
          <p className="text-xs text-center py-4 opacity-50" style={{ color: theme.otherMessageText }}>
            No groups found
          </p>
        ) : (
          <>
            {rooms.map((room) => (
              <Room
                key={room._id}
                room={room}
                currentRoom={currentRoom}
                handleJoinRoom={handleJoinRoom}
                unread={0}
              />
            ))}
          </>
        )}

        { }
        <div ref={loaderRef} className="flex justify-center py-2">
          {loading && initialLoaded && <Spinner />}
          {!hasMore && initialLoaded && rooms.length > 0 && (
            <p className="text-[10px] opacity-40" style={{ color: theme.otherMessageText }}>
              All groups loaded
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default GlobalRoomList;