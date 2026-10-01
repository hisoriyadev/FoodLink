import React from 'react';
import { useParams } from 'react-router-dom';
import LiveDeliveryTracker from '../../components/tracking/LiveDeliveryTracker';

const LiveTrackPage = () => {
  const { donationId } = useParams();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">Real-Time Delivery & GPS Tracking</h2>
        <p className="text-sm text-slate-500 mt-1">Live tracking telemetry for ongoing food redistribution transport.</p>
      </div>

      <LiveDeliveryTracker donationId={donationId} />
    </div>
  );
};

export default LiveTrackPage;
