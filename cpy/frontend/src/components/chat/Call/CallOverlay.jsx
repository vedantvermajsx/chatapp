import { useCall } from '../../../contexts/CallContext';
import CallErrorScreen from './CallErrorScreen';
import IncomingCallScreen from './IncomingCallScreen';
import ActiveCallScreen from './ActiveCallScreen';

const CallOverlay = () => {
  const { callError, incomingCall, activeCall } = useCall();

  if (callError) return <CallErrorScreen />;
  if (incomingCall) return <IncomingCallScreen />;
  if (activeCall) return <ActiveCallScreen />;

  return null;
};

export default CallOverlay;
