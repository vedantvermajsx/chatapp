import User from "../models/user.model.js";
import Guest from "../models/guest.model.js";

const NOT_FOUND_USER = {
  id: '6a2bae6f507740c0347410ff',
  username: 'Deleted User',
  gender: '2',
  role: 'user',
  avatar: 'https://res.cloudinary.com/dfxi4ihfs/image/upload/w_50,h_50,c_fill/v1781429485/not-found_1_hts9gb.avif',
  isOnline: false,
  lastSeen: 0,
  notFound:true
};


class UserDatabase{

    constructor(){

        this.model= {
            user:User,
            guest:Guest
        }
        
        this.NOT_FOUND_USER=NOT_FOUND_USER;
    }

    async getUserById(id, isUser=true) {
        try {
            const user = await this.model[isUser ? 'user' : 'guest'].findById(id).select('_id username gender role avatar isOnline lastSeen');
            if (user) {
                return {
                    id: user._id.toString(),
                    username: user.username,
                    gender: user.gender,
                    role: user.role,
                    avatar: user.avatar,
                    isOnline: user.isOnline,
                    lastSeen: user.lastSeen
                  };
            }
            return this.NOT_FOUND_USER;
        } catch (error) {
            return this.NOT_FOUND_USER;
        }
    }

    async updateUserById(id, data, isUser=true) {
        try {
            const user = await this.model[isUser ? 'user' : 'guest'].findByIdAndUpdate(id, data, { new: true }).select('_id username gender role avatar isOnline lastSeen');
            if (user) {
                return {
                    id: user._id.toString(),
                    username: user.username,
                    gender: user.gender,
                    role: user.role,
                    avatar: user.avatar,
                    isOnline: user.isOnline,
                    lastSeen: user.lastSeen
                  };
            }
            return this.NOT_FOUND_USER;
        } catch (error) {
            return this.NOT_FOUND_USER;
        }
    }

    async deleteUserById(id, isUser=true){
        try {
            const user = await this.model[isUser ? 'user' : 'guest'].findByIdAndDelete(id).select('_id username gender role avatar isOnline lastSeen');
            if (user) {
                return {
                    id: user._id.toString(),
                    username: user.username,
                    gender: user.gender,
                    role: user.role,
                    avatar: user.avatar,
                    isOnline: user.isOnline,
                    lastSeen: user.lastSeen
                  };
            }
            return this.NOT_FOUND_USER;
        } catch (error) {
            return this.NOT_FOUND_USER;
        }
    }
}

export default new UserDatabase();