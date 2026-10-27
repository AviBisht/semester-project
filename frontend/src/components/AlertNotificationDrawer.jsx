import React, { useState, useEffect } from 'react';
import {
  X,
  Bell,
  BellRing,
  AlertTriangle,
  CheckCircle2,
  MapPin,
  ShieldAlert,
  Trash2,
  RefreshCw,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import {
  getSubscriberAlerts,
  markAlertRead,
  getSubscription,
  updateSubscription,
  unsubscribeAlerts,
  subscribeToAlerts,
  getActivePublicAlerts
} from '../api';
import {
  getStoredSubscriberToken,
  setStoredSubscriberToken,
  clearStoredSubscriberToken,
  getStoredSubscriberCoords,
  setStoredSubscriberCoords,
  requestBrowserNotificationPermission,
  registerServiceWorker
} from '../utils/notifications';

export default function AlertNotificationDrawer({ isOpen, onClose, onUnreadCountChange }) {
  const [activeTab, setActiveTab] = useState('alerts'); // 'alerts' | 'manage'
  const [alerts, setAlerts] = useState([]);
  const [publicAlerts, setPublicAlerts] = useState([]);
  const [subscription, setSubscription] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState('');

  // Voluntary subscription form states (if user has no token)
  const [subLat, setSubLat] = useState(30.3165);
  const [subLng, setSubLng] = useState(78.0322);
  const [subRadius, setSubRadius] = useState(5);
  const [subLocationName, setSubLocationName] = useState('Dehradun Central');
  const [consentChecked, setConsentChecked] = useState(false);

  const subscriberToken = getStoredSubscriberToken();

  const loadData = async () => {
    setIsLoading(true);
    setActionMessage('');
    try {
      if (subscriberToken) {
        // 1. Fetch subscriber notifications
        const [alertRes, subRes] = await Promise.all([
          getSubscriberAlerts(subscriberToken).catch(() => ({ data: [] })),
          getSubscription(subscriberToken).catch(() => ({ data: null })),
        ]);
        setAlerts(alertRes.data || []);
        setSubscription(subRes.data);

        // Update unread count callback
        const unread = (alertRes.data || []).filter((a) => !a.is_read).length;
        if (onUnreadCountChange) onUnreadCountChange(unread);
      } else {
        // Fetch active public broadcasts
        const publicRes = await getActivePublicAlerts().catch(() => ({ data: [] }));
        setPublicAlerts(publicRes.data || []);
        if (onUnreadCountChange) onUnreadCountChange(0);
      }
    } catch (err) {
      console.error('Error loading alert drawer data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen, subscriberToken]);

  const handleMarkRead = async (dispatchId) => {
    if (!subscriberToken) return;
    try {
      await markAlertRead(subscriberToken, dispatchId);
      setAlerts((prev) =>
        prev.map((a) => (a.id === dispatchId ? { ...a, is_read: true } : a))
      );
      const remainingUnread = alerts.filter((a) => a.id !== dispatchId && !a.is_read).length;
      if (onUnreadCountChange) onUnreadCountChange(remainingUnread);
    } catch (err) {
      console.error('Failed to mark alert as read:', err);
    }
  };

  const handleUpdateRadius = async (newRadius) => {
    if (!subscriberToken) return;
    try {
      const res = await updateSubscription(subscriberToken, { radius_km: newRadius });
      setSubscription(res.data);
      setActionMessage(`Alert radius updated to ${newRadius} km.`);
      setTimeout(() => setActionMessage(''), 4000);
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to update alert radius');
    }
  };

  const handleUnsubscribe = async () => {
    if (!subscriberToken) return;
    if (!window.confirm('Are you sure you want to cancel your emergency alert subscription? You will stop receiving alerts for this area.')) {
      return;
    }
    try {
      await unsubscribeAlerts(subscriberToken);
      clearStoredSubscriberToken();
      setSubscription(null);
      setAlerts([]);
      if (onUnreadCountChange) onUnreadCountChange(0);
      setActionMessage('You have been unsubscribed from emergency alerts.');
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to unsubscribe');
    }
  };

  const handleCreateSubscription = async (e) => {
    e.preventDefault();
    if (!consentChecked) {
      alert('Please check the voluntary consent box to enable alerts.');
      return;
    }
    setIsLoading(true);
    try {
      await registerServiceWorker();
      await requestBrowserNotificationPermission();

      const res = await subscribeToAlerts({
        latitude: Number(subLat),
        longitude: Number(subLng),
        radius_km: Number(subRadius),
        location_name: subLocationName,
        consent: true
      });

      if (res.data && res.data.subscriber_token) {
        setStoredSubscriberToken(res.data.subscriber_token);
        setStoredSubscriberCoords({ latitude: Number(subLat), longitude: Number(subLng), radius: subRadius });
        setActionMessage('Subscription activated! You will receive verified emergency alerts.');
        loadData();
      }
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to activate subscription.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/40 backdrop-blur-xs flex justify-end">
      <div className="w-full max-w-md bg-[#FCFAF6] border-l border-[#DFD8C8] h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-200">
        {/* Drawer Header */}
        <div className="p-4 bg-[#EFE9DC] border-b border-[#DFD8C8] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded bg-[#FCFAF6] border border-[#BAC7AF] text-[#697C58]">
              <BellRing className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-[#343B30]">
                Verified Emergency Broadcasts
              </h2>
              <span className="text-[10px] font-mono text-[#5A6354]">
                Dehradun District Operations Intelligence
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded text-[#5A6354] hover:text-[#343B30] hover:bg-[#DFD8C8] transition-colors"
            aria-label="Close notification drawer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-[#DFD8C8] bg-[#FCFAF6] text-xs font-mono shrink-0">
          <button
            onClick={() => setActiveTab('alerts')}
            className={`flex-1 py-2.5 text-center transition-colors border-b-2 ${
              activeTab === 'alerts'
                ? 'border-[#697C58] text-[#343B30] font-bold bg-[#EEF2E6]/50'
                : 'border-transparent text-[#5A6354] hover:text-[#343B30]'
            }`}
          >
            Active Alerts {alerts.filter((a) => !a.is_read).length > 0 && `(${alerts.filter((a) => !a.is_read).length})`}
          </button>
          <button
            onClick={() => setActiveTab('manage')}
            className={`flex-1 py-2.5 text-center transition-colors border-b-2 ${
              activeTab === 'manage'
                ? 'border-[#697C58] text-[#343B30] font-bold bg-[#EEF2E6]/50'
                : 'border-transparent text-[#5A6354] hover:text-[#343B30]'
            }`}
          >
            Subscription Settings
          </button>
        </div>

        {/* Toast / Notification Banner */}
        {actionMessage && (
          <div className="p-2.5 bg-[#DCFCE7] border-b border-[#86EFAC] text-[#166534] text-xs font-mono flex items-center gap-2 shrink-0">
            <CheckCircle2 className="w-4 h-4 text-[#16A34A] shrink-0" />
            <span>{actionMessage}</span>
          </div>
        )}

        {/* Drawer Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs font-mono">
          {activeTab === 'alerts' ? (
            /* TAB 1: ALERTS FEED */
            subscriberToken ? (
              alerts.length === 0 ? (
                <div className="text-center py-12 text-[#7C8775] space-y-2">
                  <CheckCircle2 className="w-8 h-8 text-[#697C58] mx-auto opacity-60" />
                  <p className="font-bold text-[#343B30]">No Active Emergency Alerts in Your Area</p>
                  <p className="text-[11px] max-w-xs mx-auto">
                    District operators have not verified any active hazards within your subscribed radius ({subscription?.radius_km ?? 5} km).
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {alerts.map((item) => (
                    <div
                      key={item.id}
                      className={`p-3.5 rounded border transition-all ${
                        item.is_read
                          ? 'bg-[#FCFAF6] border-[#DFD8C8] text-[#5A6354]'
                          : 'bg-[#FEF2F2] border-[#FECACA] text-[#343B30] shadow-xs'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <span className="font-bold text-xs flex items-center gap-1.5 text-[#DC2626]">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          <span>{item.category}</span>
                        </span>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] text-[#7C8775]">
                            {item.distance_km} km away
                          </span>
                          {!item.is_read && (
                            <span className="w-2 h-2 rounded-full bg-[#DC2626]" title="Unread alert" />
                          )}
                        </div>
                      </div>

                      <h4 className="font-bold text-xs text-[#343B30] mb-1">
                        {item.title}
                      </h4>

                      <div className="flex items-center gap-1 text-[11px] text-[#5A6354] mb-2">
                        <MapPin className="w-3 h-3 text-[#7C8775]" />
                        <span>{item.approx_location}</span>
                      </div>

                      {item.safety_instructions && (
                        <div className="p-2 rounded bg-white/80 border border-[#DFD8C8] text-[11px] text-[#343B30] leading-relaxed mb-2.5 font-sans">
                          <strong className="font-mono text-[10px] uppercase text-[#697C58] block mb-0.5">
                            Public Safety Guidance:
                          </strong>
                          {item.safety_instructions}
                        </div>
                      )}

                      <div className="flex items-center justify-between text-[10px] text-[#7C8775] pt-1.5 border-t border-[#DFD8C8]/60">
                        <span>
                          Verified: {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        {!item.is_read && (
                          <button
                            onClick={() => handleMarkRead(item.id)}
                            className="text-[#697C58] hover:underline font-bold"
                          >
                            Mark as Read
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )
            ) : (
              /* Public fallback if not subscribed yet */
              <div className="space-y-4">
                <div className="p-3 bg-[#EEF2E6] border border-[#BAC7AF] rounded">
                  <span className="font-bold text-xs text-[#343B30] block mb-1">
                    You Are Viewing General Public Broadcasts
                  </span>
                  <p className="text-[11px] text-[#5A6354] leading-relaxed mb-2">
                    To receive location-targeted alerts for your specific neighborhood, configure your alert radius in the Settings tab.
                  </p>
                  <button
                    onClick={() => setActiveTab('manage')}
                    className="py-1 px-3 rounded bg-[#697C58] text-white text-[10px] uppercase font-bold"
                  >
                    Subscribe Now
                  </button>
                </div>

                <span className="text-[10px] font-mono uppercase tracking-wider text-[#5A6354] block font-bold">
                  Recent Verified District Broadcasts ({publicAlerts.length})
                </span>

                {publicAlerts.length === 0 ? (
                  <p className="text-xs text-[#7C8775] italic py-6 text-center">
                    No verified municipal broadcasts in the past 48 hours.
                  </p>
                ) : (
                  publicAlerts.map((a) => (
                    <div key={a.id} className="p-3 bg-[#FCFAF6] border border-[#DFD8C8] rounded space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[#DC2626] text-xs">{a.category}</span>
                        <span className="text-[10px] text-[#7C8775]">
                          {new Date(a.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                        </span>
                      </div>
                      <p className="text-xs font-semibold text-[#343B30]">{a.title}</p>
                      <p className="text-[11px] text-[#5A6354]">{a.approx_location}</p>
                    </div>
                  ))
                )}
              </div>
            )
          ) : (
            /* TAB 2: SUBSCRIPTION SETTINGS */
            subscriberToken && subscription ? (
              <div className="space-y-4">
                <div className="p-3.5 bg-[#FFFFFF] border border-[#DFD8C8] rounded space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase tracking-wider text-[#5A6354] font-bold">
                      Current Subscription
                    </span>
                    <span className="px-2 py-0.5 rounded-sm bg-[#DCFCE7] text-[#166534] border border-[#86EFAC] text-[10px] font-bold uppercase">
                      Active
                    </span>
                  </div>

                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-[#5A6354]">Location:</span>
                      <span className="font-bold text-[#343B30]">{subscription.location_name || 'Designated Coordinates'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#5A6354]">Coordinates:</span>
                      <span className="text-[#697C58] font-bold">{subscription.latitude.toFixed(4)}, {subscription.longitude.toFixed(4)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#5A6354]">Alert Radius:</span>
                      <span className="font-bold text-[#343B30]">{subscription.radius_km} km</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#5A6354]">Browser Push:</span>
                      <span className={subscription.has_push ? 'text-[#166534] font-bold' : 'text-[#7C8775]'}>
                        {subscription.has_push ? 'Enabled' : 'In-App Only'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Adjust Radius */}
                <div className="p-3.5 bg-[#FCFAF6] border border-[#DFD8C8] rounded space-y-2">
                  <span className="text-[10px] uppercase tracking-wider text-[#5A6354] font-bold block">
                    Change Alert Radius
                  </span>
                  <div className="grid grid-cols-4 gap-1.5">
                    {[2, 5, 10, 15].map((r) => (
                      <button
                        key={r}
                        onClick={() => handleUpdateRadius(r)}
                        className={`py-1.5 rounded text-xs font-mono border transition-colors ${
                          subscription.radius_km === r
                            ? 'bg-[#697C58] text-white font-bold border-[#697C58]'
                            : 'bg-[#FFFFFF] text-[#343B30] border-[#DFD8C8] hover:bg-[#EEF2E6]'
                        }`}
                      >
                        {r} km
                      </button>
                    ))}
                  </div>
                </div>

                {/* Unsubscribe Button */}
                <div className="pt-2">
                  <button
                    onClick={handleUnsubscribe}
                    className="w-full py-2.5 px-3 rounded bg-[#FEF2F2] hover:bg-[#FEE2E2] text-[#991B1B] border border-[#FECACA] font-bold text-xs transition-colors flex items-center justify-center gap-2"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Unsubscribe &amp; Cancel Alerts</span>
                  </button>
                  <span className="text-[10px] text-[#7C8775] block text-center mt-1.5 leading-snug">
                    Revokes consent and stops emergency notifications for this device.
                  </span>
                </div>
              </div>
            ) : (
              /* If no subscription, show setup form */
              <form onSubmit={handleCreateSubscription} className="space-y-3.5">
                <div className="p-3 bg-[#EEF2E6] border border-[#BAC7AF] rounded">
                  <span className="font-bold text-xs text-[#343B30] block mb-1">
                    Voluntary Emergency Alert Subscription
                  </span>
                  <p className="text-[11px] text-[#5A6354] leading-relaxed">
                    Subscribe to receive immediate in-app warnings when municipal operators officially verify an emergency within your chosen sector in Dehradun district.
                  </p>
                </div>

                <div>
                  <label className="text-[10px] uppercase tracking-wider text-[#5A6354] font-bold block mb-1">
                    Area / Locality Name
                  </label>
                  <input
                    type="text"
                    value={subLocationName}
                    onChange={(e) => setSubLocationName(e.target.value)}
                    placeholder="e.g. Rajpur Road / Jakhan / Ballupur"
                    className="w-full text-xs font-mono rounded border border-[#DFD8C8] p-2 bg-[#FFFFFF] text-[#343B30] focus:outline-none focus:border-[#697C58]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] uppercase tracking-wider text-[#5A6354] font-bold block mb-1">
                      Latitude
                    </label>
                    <input
                      type="number"
                      step="0.0001"
                      value={subLat}
                      onChange={(e) => setSubLat(e.target.value)}
                      className="w-full text-xs font-mono rounded border border-[#DFD8C8] p-2 bg-[#FFFFFF] text-[#343B30] focus:outline-none focus:border-[#697C58]"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase tracking-wider text-[#5A6354] font-bold block mb-1">
                      Longitude
                    </label>
                    <input
                      type="number"
                      step="0.0001"
                      value={subLng}
                      onChange={(e) => setSubLng(e.target.value)}
                      className="w-full text-xs font-mono rounded border border-[#DFD8C8] p-2 bg-[#FFFFFF] text-[#343B30] focus:outline-none focus:border-[#697C58]"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] uppercase tracking-wider text-[#5A6354] font-bold block mb-1">
                    Alert Radius (km)
                  </label>
                  <div className="grid grid-cols-4 gap-1.5">
                    {[2, 5, 10, 15].map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setSubRadius(r)}
                        className={`py-1.5 rounded text-xs font-mono border transition-colors ${
                          subRadius === r
                            ? 'bg-[#697C58] text-white font-bold border-[#697C58]'
                            : 'bg-[#FFFFFF] text-[#343B30] border-[#DFD8C8]'
                        }`}
                      >
                        {r} km
                      </button>
                    ))}
                  </div>
                </div>

                <label className="flex items-start gap-2 cursor-pointer pt-1">
                  <input
                    type="checkbox"
                    checked={consentChecked}
                    onChange={(e) => setConsentChecked(e.target.checked)}
                    className="mt-0.5 rounded text-[#697C58] focus:ring-[#697C58]"
                  />
                  <span className="text-[11px] text-[#343B30] leading-snug">
                    I voluntarily consent to receive operator-verified emergency alerts for this geographic sector.
                  </span>
                </label>

                <button
                  type="submit"
                  disabled={!consentChecked || isLoading}
                  className="w-full py-2.5 px-4 rounded bg-[#697C58] hover:bg-[#576748] text-white font-mono font-bold text-xs uppercase tracking-wider transition-colors disabled:opacity-40"
                >
                  {isLoading ? 'Activating...' : 'Activate Emergency Alerts'}
                </button>
              </form>
            )
          )}
        </div>
      </div>
    </div>
  );
}
