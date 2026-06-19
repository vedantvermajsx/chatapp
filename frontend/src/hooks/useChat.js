import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import roomService from '../services/room.service.js';
import messageService from '../services/message.service.js';
import authService from '../services/auth.service.js';
import userService from '../services/user.service.js';

export const useProfile = () =>
  useQuery({
    queryKey: ['profile'],
    queryFn: () => userService.getProfile(),
    retry: false,
  });

export const useLogin = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ email, password }) => authService.login({ email, password }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['profile'] }),
  });
};

export const useRegister = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => authService.register(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['profile'] }),
  });
};

export const useGuestLogin = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ gender, age }) => authService.guestLogin({ gender, age }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['profile'] }),
  });
};

export const useLogout = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => authService.logout(),
    onSuccess: () => qc.clear(),
  });
};

export const useRooms = (search = '') =>
  useQuery({
    queryKey: ['rooms', search],
    queryFn: () => roomService.getAllRooms(search),
    staleTime: 30_000,
  });

export const useCreateRoom = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ groupName, groupDescription }) =>
      roomService.createRoom(groupName, groupDescription),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['rooms'] }),
  });
};

export const useJoinRoom = () =>
  useMutation({
    mutationFn: (roomId) => roomService.joinRoom(roomId),
  });

export const useDeleteRoom = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (roomId) => roomService.deleteRoom(roomId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['rooms'] }),
  });
};

export const useRoomMembers = (roomId, enabled = false) =>
  useQuery({
    queryKey: ['roomMembers', roomId],
    queryFn: () => roomService.getRoomMembers(roomId),
    enabled: !!roomId && enabled,
    staleTime: 15_000,
  });

export const useRoomMessages = (roomId, enabled = false) =>
  useInfiniteQuery({
    queryKey: ['roomMessages', roomId],
    queryFn: ({ pageParam }) =>
      messageService.getRoomMessages(roomId, 20, pageParam ?? null),
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? lastPage.messages[0]?.timestamp : undefined,
    initialPageParam: null,
    enabled: !!roomId && enabled,
    select: (data) => ({
      ...data,
      messages: data.pages.flatMap((p) => p.messages),
    }),
  });

export const usePrivateMessages = (otherUserId, enabled = false) =>
  useInfiniteQuery({
    queryKey: ['privateMessages', otherUserId],
    queryFn: ({ pageParam }) =>
      messageService.getPrivateMessages(otherUserId, 20, pageParam ?? null),
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? lastPage.messages[0]?.timestamp : undefined,
    initialPageParam: null,
    enabled: !!otherUserId && enabled,
    select: (data) => ({
      ...data,
      messages: data.pages.flatMap((p) => p.messages),
    }),
  });

export const usePrivateChats = () =>
  useQuery({
    queryKey: ['privateChats'],
    queryFn: () => messageService.getPrivateChats(),
    staleTime: 20_000,
  });

export const useSendRoomMessage = (roomId) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (content) => messageService.sendMessage(roomId, content),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['roomMessages', roomId] }),
  });
};

export const useSendPrivateMessage = (otherUserId) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ content, receiverModel }) =>
      messageService.sendPrivateMessage(otherUserId, content, receiverModel),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['privateMessages', otherUserId] });
      qc.invalidateQueries({ queryKey: ['privateChats'] });
    },
  });
};
