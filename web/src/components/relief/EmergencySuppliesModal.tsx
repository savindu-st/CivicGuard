import React, { useState, useMemo } from 'react';
import {
  X,
  Package,
  Plus,
  Minus,
  CheckCircle2,
  AlertTriangle,
  Send,
  Home,
  Utensils,
  Droplets,
  HeartPulse,
  Layers,
  Sparkles,
} from 'lucide-react';
import { api } from '../../services/api';

export interface EmergencySuppliesModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetRequest: any | null;
  targetShelter?: any | null;
  shelters: any[];
  resources: any[];
  requests: any[];
  onAllocated: () => void;
}

export const EmergencySuppliesModal: React.FC<EmergencySuppliesModalProps> = ({
  isOpen,
  onClose,
  targetRequest,
  targetShelter,
  shelters,
  resources,
  requests,
  onAllocated,
}) => {
  if (!isOpen) return null;

  const [activeTab, setActiveTab] = useState<'ALLOCATE' | 'RESTOCK'>('ALLOCATE');
  const [selectedRequestId, setSelectedRequestId] = useState<string>(targetRequest?.id || '');
  const [selectedShelterId, setSelectedShelterId] = useState<string>(
    targetShelter?.id || (shelters.length > 0 ? shelters[0].id : '')
  );

  // Parcel allocation quantities map: { [resource_id]: quantity }
  const [allocations, setAllocations] = useState<Record<string, number>>({});
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Restock Form State
  const [restockType, setRestockType] = useState<string>('FOOD');
  const [restockName, setRestockName] = useState<string>('');
  const [restockQty, setRestockQty] = useState<number>(100);
  const [restockUnit, setRestockUnit] = useState<string>('PACK');

  // Filter available warehouse resources
  const availableResources = useMemo(() => {
    return resources.filter((r) => r.status === 'AVAILABLE' && r.quantity > 0);
  }, [resources]);

  // Update allocation quantity for an item
  const handleQuantityChange = (resourceId: string, maxQty: number, nextQty: number) => {
    const valid = Math.max(0, Math.min(maxQty, nextQty));
    setAllocations((prev) => ({
      ...prev,
      [resourceId]: valid,
    }));
  };

  // Submit Multi-Resource Parcel Allocation
  const handleParcelAllocation = async () => {
    if (!selectedRequestId) {
      setErrorMessage('Please select a target SOS distress request to allocate supplies.');
      return;
    }

    const items = Object.entries(allocations)
      .filter(([_, qty]) => qty > 0)
      .map(([resource_id, quantity]) => ({ resource_id, quantity }));

    if (items.length === 0) {
      setErrorMessage('Please select at least one supply item with quantity greater than 0.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      await api.post('/api/relief/resources/allocate-parcel', {
        help_request_id: selectedRequestId,
        allocations: items,
      });

      onAllocated();
      onClose();
    } catch (err: any) {
      console.error('Failed to allocate parcel:', err);
      setErrorMessage(err.message || 'Failed to allocate relief supplies.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit Restock Form
  const handleRestockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restockName.trim() || restockQty <= 0) {
      setErrorMessage('Please provide a valid supply item name and positive quantity.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      await api.post('/api/relief/resources', {
        shelter_id: selectedShelterId,
        resource_type: restockType,
        resource_name: restockName.trim(),
        quantity: Number(restockQty),
        unit: restockUnit,
      });

      setRestockName('');
      setRestockQty(100);
      onAllocated();
      setActiveTab('ALLOCATE');
    } catch (err: any) {
      console.error('Failed to restock shelter:', err);
      setErrorMessage(err.message || 'Failed to register supply shipment.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getResourceIcon = (type: string) => {
    switch (type) {
      case 'FOOD':
        return <Utensils className="w-4 h-4 text-amber-400" />;
      case 'WATER':
        return <Droplets className="w-4 h-4 text-cyan-400" />;
      case 'MEDICAL':
        return <HeartPulse className="w-4 h-4 text-rose-400" />;
      default:
        return <Package className="w-4 h-4 text-sky-400" />;
    }
  };

  const currentSOS = requests.find((r) => r.id === selectedRequestId);

  return (
    <div className="fixed inset-0 z-[2000] bg-slate-950/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 bg-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-600">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <span>Emergency Humanitarian Supplies Allocation</span>
              </h2>
              <p className="text-xs text-slate-500">
                Multi-resource parcel distribution & emergency warehouse inventory management
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 border border-slate-200 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Toggle Bar */}
        <div className="flex border-b border-slate-100 bg-slate-50/50 px-6 pt-2">
          <button
            onClick={() => setActiveTab('ALLOCATE')}
            className={`pb-2.5 px-4 font-bold text-xs flex items-center gap-2 border-b-2 transition-all ${
              activeTab === 'ALLOCATE'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Send className="w-3.5 h-3.5" />
            <span>Allocate Parcel to SOS Request</span>
          </button>
          <button
            onClick={() => setActiveTab('RESTOCK')}
            className={`pb-2.5 px-4 font-bold text-xs flex items-center gap-2 border-b-2 transition-all ${
              activeTab === 'RESTOCK'
                ? 'border-brand-600 text-brand-700'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Register Warehouse Shipment (Restock)</span>
          </button>
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {errorMessage && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {activeTab === 'ALLOCATE' ? (
            <div className="space-y-4">
              {/* Target SOS Selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Target SOS Help Request:</label>
                <select
                  value={selectedRequestId}
                  onChange={(e) => setSelectedRequestId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-brand-500 focus:bg-white transition-colors"
                >
                  <option value="">-- Select SOS Request --</option>
                  {requests.map((r) => (
                    <option key={r.id} value={r.id}>
                      [{r.urgency}] {r.help_type} • {r.people_count}p • {r.users?.name || r.user_name || 'Citizen'} ({r.description?.slice(0, 45)}...)
                    </option>
                  ))}
                </select>

                {currentSOS && (
                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-[11px] text-slate-700 flex items-center justify-between">
                    <span>
                      Need: <strong>{currentSOS.help_type}</strong> for <strong>{currentSOS.people_count} People</strong>
                    </span>
                    <span className="badge-critical text-[10px]">{currentSOS.urgency}</span>
                  </div>
                )}
              </div>

              {/* Warehouse Supplies Multi-Selector */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-900 uppercase tracking-wider">
                    Available Warehouse Inventory
                  </span>
                  <span className="text-slate-500 text-[11px]">
                    Specify quantity to include in family relief parcel
                  </span>
                </div>

                {availableResources.length === 0 ? (
                  <div className="p-6 text-center border border-dashed border-slate-200 rounded-xl text-slate-400 text-xs">
                    No supplies currently available across centers. Use the "Register Warehouse Shipment" tab to add inventory.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {availableResources.map((res) => {
                      const currentQty = allocations[res.id] || 0;

                      return (
                        <div
                          key={res.id}
                          className={`p-3 rounded-xl border flex items-center justify-between gap-3 transition-all ${
                            currentQty > 0
                              ? 'bg-emerald-50/50 border-emerald-300 shadow-xs'
                              : 'bg-slate-50 border-slate-200'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-white border border-slate-200">
                              {getResourceIcon(res.resource_type)}
                            </div>
                            <div>
                              <h4 className="text-xs font-bold text-slate-900">{res.resource_name}</h4>
                              <p className="text-[11px] text-slate-500">
                                Center: {res.shelter_name || 'Relief Warehouse'} • Stock:{' '}
                                <strong className="text-emerald-700">{res.quantity} {res.unit}</strong>
                              </p>
                            </div>
                          </div>

                          {/* Quantity Counter Control */}
                          <div className="flex items-center gap-2 bg-white px-2 py-1 rounded-lg border border-slate-300">
                            <button
                              type="button"
                              onClick={() => handleQuantityChange(res.id, res.quantity, currentQty - 1)}
                              className="p-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <input
                              type="number"
                              min="0"
                              max={res.quantity}
                              value={currentQty}
                              onChange={(e) =>
                                handleQuantityChange(res.id, res.quantity, parseInt(e.target.value) || 0)
                              }
                              className="w-10 text-center bg-transparent font-bold text-xs text-slate-900 focus:outline-none"
                            />
                            <button
                              type="button"
                              onClick={() => handleQuantityChange(res.id, res.quantity, currentQty + 1)}
                              className="p-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                            <span className="text-[10px] text-slate-500 font-mono pr-1">{res.unit}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* RESTOCK TAB FORM */
            <form onSubmit={handleRestockSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Receiving Center / Shelter:</label>
                <select
                  value={selectedShelterId}
                  onChange={(e) => setSelectedShelterId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-brand-500 focus:bg-white transition-colors"
                >
                  {shelters.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.address || s.ward_name || 'Center'})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">Resource Category:</label>
                  <select
                    value={restockType}
                    onChange={(e) => setRestockType(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-brand-500 focus:bg-white transition-colors"
                  >
                    <option value="FOOD">FOOD (Dry Rations / Cooked Meals)</option>
                    <option value="WATER">WATER (Bottled Water / Canteens)</option>
                    <option value="MEDICAL">MEDICAL (First Aid Kits / Insulin)</option>
                    <option value="BEDDING">BEDDING (Foldable Cots / Blankets)</option>
                    <option value="CLOTHING">CLOTHING (Emergency Dry Garments)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">Unit of Measurement:</label>
                  <select
                    value={restockUnit}
                    onChange={(e) => setRestockUnit(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-brand-500 focus:bg-white transition-colors"
                  >
                    <option value="PACK">PACK</option>
                    <option value="BOTTLE">BOTTLE</option>
                    <option value="KIT">KIT</option>
                    <option value="UNIT">UNIT</option>
                    <option value="BOX">BOX</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2 space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">Supply Item Name:</label>
                  <input
                    type="text"
                    required
                    value={restockName}
                    onChange={(e) => setRestockName(e.target.value)}
                    placeholder="e.g. 5L Purified Water Bottles or Dry Ration Packs"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-brand-500 focus:bg-white transition-colors"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">Quantity:</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={restockQty}
                    onChange={(e) => setRestockQty(parseInt(e.target.value) || 0)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-brand-500 focus:bg-white transition-colors"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs tracking-wide shadow-sm flex items-center justify-center gap-2 transition-all"
              >
                {isSubmitting ? (
                  <span>Registering Shipment...</span>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    <span>Register New Shipment to Warehouse</span>
                  </>
                )}
              </button>
            </form>
          )}
        </div>

        {/* Modal Footer (for Allocate Tab) */}
        {activeTab === 'ALLOCATE' && (
          <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between gap-4">
            <span className="text-xs text-slate-500">
              Selected Items:{' '}
              <strong className="text-slate-900">
                {Object.values(allocations).filter((q) => q > 0).length} items
              </strong>
            </span>

            <div className="flex items-center gap-2.5">
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 font-semibold text-xs border border-slate-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleParcelAllocation}
                disabled={isSubmitting || !selectedRequestId}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs tracking-wide shadow-sm flex items-center gap-2 transition-all"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>Dispatching Parcel...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Allocate Parcel to Request</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
