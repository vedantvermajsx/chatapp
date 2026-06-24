import { isUsernameTaken } from "./usernameTaken.js";

export async function checkUsername(req, res) {
  try {
    const { username } = req.query;
    if (!username || typeof username !== 'string') {
      return res.status(400).json({ message: 'Username is required' });
    }
    
    const trimmedUsername = username.trim();
    if (trimmedUsername.length === 0) {
      return res.status(400).json({ message: 'Username cannot be empty' });
    }

    const taken = await isUsernameTaken(trimmedUsername);
    if(taken){
      return res.status(200).json({ isTaken: true });
    }else{
      return res.status(200).json({ isTaken: false });
    }
    
  } catch (error) {
    return res.status(500).json({ message: 'Internal server error' });
  }
}
