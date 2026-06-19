import React, { useState, useRef } from 'react';
import { X, Loader2, Camera } from 'lucide-react';
import { toast } from 'sonner';
import roomService from '../../../services/room.service';
import api from '../../../services/api';
import Avatar from '../../common/Avatar';

const GroupSettingsModal = ({ room, onClose, onUpdateSuccess }) => {
  const [groupName, setGroupName] = useState(room.groupName || '');
  const [groupDescription, setGroupDescription] = useState(room.groupDescription || '');
  const [groupPic, setGroupPic] = useState(room.groupPic || '');
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file');
        return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', 'avatar');

    try {
      const response = await api.post('/messages/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setGroupPic(response.data.url);
      toast.success('Image uploaded successfully');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to upload image');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const updatedData = { groupName: groupName.trim(), groupDescription: groupDescription.trim(), groupPic };
      const updatedRoom = await roomService.updateRoom(room._id, updatedData);
      toast.success('Group updated successfully');
      onUpdateSuccess(updatedRoom.room);
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update group');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black bg-opacity-50" onClick={onClose} />
      <div className="relative bg-[#e6e6e6] rounded-3xl w-full max-w-md overflow-hidden shadow-[5px_5px_10px_#c9c9c9,-5px_-5px_10px_#ffffff] flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-800">Group Settings</h2>
          <button onClick={onClose} className="p-2 rounded-full bg-[#e6e6e6] shadow-[1px_1px_3px_#c9c9c9,-1px_-1px_3px_#ffffff] hover:bg-[#c0b6b6] transition-all">
            <X className="w-5 h-5 text-gray-700" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto">
          <form id="group-form" onSubmit={handleSubmit} className="space-y-6">
            <div className="flex flex-col items-center gap-4">
              <div className="relative">
                <Avatar url={groupPic} name={groupName} size={24} className="w-24 h-24 text-3xl shadow-[inset_3px_3px_6px_#c9c9c9,inset_-3px_-3px_6px_#ffffff]" isGroup />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="absolute bottom-0 right-0 p-2 rounded-full bg-[#e6e6e6] shadow-[2px_2px_4px_#c9c9c9,-2px_-2px_4px_#ffffff] text-gray-700 hover:text-blue-600 transition-all border border-gray-100 disabled:opacity-50"
                  title="Upload group picture"
                >
                  {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
                </button>
                <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="image/*" className="hidden" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Group Name</label>
              <input
                type="text"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                className="w-full px-4 py-3 bg-[#e6e6e6] border-none rounded-xl focus:outline-none shadow-[inset_2px_2px_4px_#c9c9c9,inset_-2px_-2px_4px_#ffffff] text-gray-800 placeholder:text-gray-400"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Description</label>
              <textarea
                value={groupDescription}
                onChange={(e) => setGroupDescription(e.target.value)}
                rows={3}
                className="w-full px-4 py-3 bg-[#e6e6e6] border-none rounded-xl focus:outline-none shadow-[inset_2px_2px_4px_#c9c9c9,inset_-2px_-2px_4px_#ffffff] text-gray-800 placeholder:text-gray-400 resize-none"
                placeholder="Group description..."
                required
              />
            </div>
            
             <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Or, Image URL</label>
              <input
                type="text"
                value={groupPic}
                onChange={(e) => setGroupPic(e.target.value)}
                className="w-full px-4 py-3 bg-[#e6e6e6] border-none rounded-xl focus:outline-none shadow-[inset_2px_2px_4px_#c9c9c9,inset_-2px_-2px_4px_#ffffff] text-gray-800 text-sm placeholder:text-gray-400"
                placeholder="https://..."
              />
            </div>

          </form>
        </div>

        <div className="p-6 border-t border-gray-200">
          <button
            type="submit"
            form="group-form"
            disabled={isSaving || isUploading}
            className="w-full py-4 bg-[#e6e6e6] text-[#008080] font-bold rounded-2xl transition-all shadow-[inset_2px_2px_4px_#c9c9c9,inset_-2px_-2px_4px_#ffffff] hover:bg-[#d9d9d9] flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default GroupSettingsModal;
