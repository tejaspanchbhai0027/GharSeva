import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { Calendar, Clock, MapPin, CreditCard, CheckCircle, ArrowRight, ArrowLeft } from 'lucide-react';

const BookingWizardPage = () => {
  const { providerId, serviceId } = useParams();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Data state
  const [provider, setProvider] = useState(null);
  const [service, setService] = useState(null);
  const [availability, setAvailability] = useState([]);
  const [addresses, setAddresses] = useState([]);

  // Selections
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [selectedAddressId, setSelectedAddressId] = useState('');
  const [newAddress, setNewAddress] = useState({ title: '', address_text: '' });
  const [isAddingAddress, setIsAddingAddress] = useState(false);
  const [notes, setNotes] = useState('');
  const [estimatedHours, setEstimatedHours] = useState(1);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [provRes, servRes, availRes, addrRes] = await Promise.all([
          api.get(`/providers/${providerId}`),
          api.get(`/services/${serviceId}`),
          api.get(`/providers/${providerId}/availability`),
          api.get('/auth/me/addresses') // From our new endpoint
        ]);
        setProvider(provRes.data);
        setService(servRes.data);
        setAvailability(availRes.data);
        setAddresses(addrRes.data);
      } catch (err) {
        console.error(err);
        setError("Failed to load booking details.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [providerId, serviceId]);

  const handleAddAddress = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/auth/me/addresses', newAddress);
      setAddresses([res.data, ...addresses]);
      setSelectedAddressId(res.data.address_id);
      setIsAddingAddress(false);
      setNewAddress({ title: '', address_text: '' });
    } catch (err) {
      alert("Failed to add address");
    }
  };

  const handleConfirmBooking = async () => {
    if (!selectedDate || !selectedTime || !selectedAddressId) return;
    setSubmitting(true);
    try {
      // Combine date and time for scheduled_at
      const scheduledAt = new Date(`${selectedDate}T${selectedTime}`).toISOString();
      const finalPrice = service.price_type === 'hourly' ? (service.base_price * estimatedHours) : service.base_price;
      const payload = {
        provider_id: providerId,
        service_id: serviceId,
        scheduled_at: scheduledAt,
        address_id: selectedAddressId,
        total_amount: finalPrice,
        notes: notes
      };
      
      const res = await api.post('/bookings', payload);
      navigate(`/customer/bookings/${res.data.booking_id}`);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || "Failed to confirm booking.");
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12 flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-amber-500"></div>
      </div>
    );
  }

  if (error && step === 1) {
    return <div className="text-center text-red-500 p-8">{error}</div>;
  }

  // Helper to get dates for the next 7 days
  const getNext7Days = () => {
    const dates = [];
    for (let i = 1; i <= 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      dates.push(d);
    }
    return dates;
  };

  const nextDays = getNext7Days();

  // Find available slots for the selected date
  const getAvailableSlots = () => {
    if (!selectedDate) return [];
    const dateObj = new Date(selectedDate);
    const dayOfWeek = dateObj.getDay(); // 0-6
    return availability.filter(a => a.day_of_week === dayOfWeek && !a.is_blocked);
  };

  const availableSlots = getAvailableSlots();

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Book Service</h1>
        <p className="text-slate-400">
          Booking <span className="text-amber-500 font-semibold">{service?.name}</span> with <span className="text-amber-500 font-semibold">{provider?.full_name}</span>
        </p>
      </div>

      {/* Progress Bar */}
      <div className="flex items-center justify-between mb-8 relative">
        <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-full h-1 bg-slate-800 -z-10"></div>
        <div className="absolute left-0 top-1/2 transform -translate-y-1/2 h-1 bg-amber-500 -z-10 transition-all duration-300" style={{ width: `${((step - 1) / 2) * 100}%` }}></div>
        
        {[1, 2, 3].map(s => (
          <div key={s} className={`w-10 h-10 rounded-full flex items-center justify-center font-bold border-4 ${step >= s ? 'bg-amber-500 border-amber-500 text-slate-950' : 'bg-slate-900 border-slate-700 text-slate-500'}`}>
            {s}
          </div>
        ))}
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl">
        {error && <div className="bg-red-500/10 border border-red-500 text-red-500 p-3 rounded mb-4">{error}</div>}

        {/* STEP 1: Date & Time */}
        {step === 1 && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Calendar className="text-amber-500" /> Select Date & Time
            </h2>
            
            <div>
              <label className="block text-slate-400 mb-3">Available Dates</label>
              <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-slate-900">
                {nextDays.map((d, i) => {
                  const dateString = d.toISOString().split('T')[0];
                  const isSelected = selectedDate === dateString;
                  return (
                    <button
                      key={i}
                      onClick={() => { setSelectedDate(dateString); setSelectedTime(''); }}
                      className={`flex-shrink-0 w-20 h-24 rounded-xl flex flex-col items-center justify-center border-2 transition-colors ${isSelected ? 'border-amber-500 bg-amber-500/10' : 'border-slate-700 bg-slate-950 hover:border-slate-500'}`}
                    >
                      <span className="text-xs text-slate-400 uppercase font-semibold">{d.toLocaleDateString('en-US', { weekday: 'short' })}</span>
                      <span className={`text-2xl font-bold ${isSelected ? 'text-amber-500' : 'text-white'}`}>{d.getDate()}</span>
                      <span className="text-xs text-slate-500">{d.toLocaleDateString('en-US', { month: 'short' })}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {selectedDate && (
              <div className="animate-fadeIn">
                <label className="block text-slate-400 mb-3">Available Time Slots</label>
                {availableSlots.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {availableSlots.map((slot, i) => {
                      // Formatting time to step intervals could be complex, for now we just show the start time of the availability block
                      const timeString = slot.start_time;
                      const isSelected = selectedTime === timeString;
                      return (
                        <button
                          key={i}
                          onClick={() => setSelectedTime(timeString)}
                          className={`py-3 px-4 rounded-lg flex items-center justify-center gap-2 border-2 transition-colors ${isSelected ? 'border-amber-500 bg-amber-500 text-slate-950 font-bold' : 'border-slate-700 bg-slate-950 text-slate-300 hover:border-slate-500'}`}
                        >
                          <Clock size={16} /> {timeString.substring(0, 5)}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-amber-500 bg-amber-500/10 p-4 rounded-lg">Provider is fully booked on this date. Please select another date.</p>
                )}
              </div>
            )}

            <div className="flex justify-end pt-4">
              <button 
                disabled={!selectedDate || !selectedTime}
                onClick={() => setStep(2)}
                className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold py-3 px-6 rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50"
              >
                Next Step <ArrowRight size={18} />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: Address & Cost */}
        {step === 2 && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <MapPin className="text-amber-500" /> Location & Cost
            </h2>
            
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <label className="block text-slate-400 mb-3">Service Address</label>
                
                {!isAddingAddress ? (
                  <div className="space-y-3">
                    {addresses.length === 0 ? (
                      <p className="text-slate-500 text-sm italic">You don't have any saved addresses.</p>
                    ) : (
                      addresses.map(addr => (
                        <div 
                          key={addr.address_id}
                          onClick={() => setSelectedAddressId(addr.address_id)}
                          className={`p-4 rounded-lg border-2 cursor-pointer transition-colors ${selectedAddressId === addr.address_id ? 'border-amber-500 bg-amber-500/10' : 'border-slate-700 bg-slate-950 hover:border-slate-600'}`}
                        >
                          <h4 className="font-bold text-white">{addr.title}</h4>
                          <p className="text-sm text-slate-400 mt-1">{addr.address_text}</p>
                        </div>
                      ))
                    )}
                    
                    <button 
                      onClick={() => setIsAddingAddress(true)}
                      className="text-amber-500 text-sm font-semibold hover:underline mt-2 inline-block"
                    >
                      + Add New Address
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleAddAddress} className="space-y-4 bg-slate-950 p-4 border border-slate-700 rounded-lg">
                    <div>
                      <label className="block text-xs text-slate-500 mb-1">Title (e.g. Home, Office)</label>
                      <input 
                        required type="text" 
                        value={newAddress.title} onChange={e => setNewAddress({...newAddress, title: e.target.value})}
                        className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white" 
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-500 mb-1">Full Address</label>
                      <textarea 
                        required rows="3"
                        value={newAddress.address_text} onChange={e => setNewAddress({...newAddress, address_text: e.target.value})}
                        className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white" 
                      ></textarea>
                    </div>
                    <div className="flex gap-2">
                      <button type="submit" className="bg-amber-500 text-slate-950 px-3 py-1.5 rounded font-semibold text-sm">Save</button>
                      <button type="button" onClick={() => setIsAddingAddress(false)} className="bg-slate-800 text-white px-3 py-1.5 rounded font-semibold text-sm">Cancel</button>
                    </div>
                  </form>
                )}
              </div>

              {/* Cost Estimation */}
              <div className="bg-slate-950 p-6 border border-slate-700 rounded-xl h-fit">
                <h3 className="font-bold text-lg text-white mb-4 flex items-center gap-2">
                  <CreditCard className="text-amber-500" size={20} /> Cost Estimation
                </h3>
                {service?.price_type === 'hourly' && (
                  <div className="mb-4 bg-slate-900 p-3 rounded border border-slate-700">
                    <label className="block text-sm text-slate-400 mb-2">Estimated Hours Required</label>
                    <div className="flex items-center gap-3">
                      <button onClick={() => setEstimatedHours(Math.max(1, estimatedHours - 1))} className="w-8 h-8 rounded bg-slate-800 text-white font-bold hover:bg-slate-700">-</button>
                      <span className="font-bold text-lg w-8 text-center">{estimatedHours}</span>
                      <button onClick={() => setEstimatedHours(estimatedHours + 1)} className="w-8 h-8 rounded bg-slate-800 text-white font-bold hover:bg-slate-700">+</button>
                    </div>
                  </div>
                )}
                
                <div className="flex justify-between items-center mb-3">
                  <span className="text-slate-400">{service?.name} ({service?.price_type === 'hourly' ? 'Rate/hr' : 'Base Price'})</span>
                  <span className="text-white font-semibold">₹{service?.base_price}</span>
                </div>
                {service?.price_type === 'hourly' && (
                  <div className="flex justify-between items-center mb-3 text-sm text-slate-500">
                    <span>x {estimatedHours} hours</span>
                    <span>₹{service?.base_price * estimatedHours}</span>
                  </div>
                )}
                <div className="flex justify-between items-center mb-3 pb-3 border-b border-slate-800">
                  <span className="text-slate-400">Taxes & Fees</span>
                  <span className="text-white font-semibold">₹0.00</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-lg font-bold text-white">Total</span>
                  <span className="text-2xl font-black text-amber-500">₹{service?.price_type === 'hourly' ? service?.base_price * estimatedHours : service?.base_price}</span>
                </div>
                <p className="text-xs text-slate-500 mt-4 italic">
                  * Final price may vary slightly depending on the scope of work upon provider inspection.
                </p>
              </div>
            </div>

            <div className="flex justify-between pt-4">
              <button 
                onClick={() => setStep(1)}
                className="bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 px-6 rounded-lg flex items-center gap-2 transition-colors"
              >
                <ArrowLeft size={18} /> Back
              </button>
              <button 
                disabled={!selectedAddressId}
                onClick={() => setStep(3)}
                className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold py-3 px-6 rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50"
              >
                Next Step <ArrowRight size={18} />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Confirm */}
        {step === 3 && (
          <div className="space-y-6 animate-fadeIn">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <CheckCircle className="text-amber-500" /> Confirm Booking
            </h2>
            
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-6">
              <h3 className="font-bold text-lg mb-4 border-b border-slate-800 pb-2">Booking Summary</h3>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-slate-500 mb-1">Service</p>
                  <p className="font-semibold text-white">
                    {service?.name}
                    {service?.price_type === 'hourly' && <span className="text-amber-500 text-sm ml-2">({estimatedHours} hrs)</span>}
                  </p>
                  
                  <p className="text-sm text-slate-500 mb-1 mt-4">Provider</p>
                  <p className="font-semibold text-white">{provider?.full_name}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500 mb-1">Date & Time</p>
                  <p className="font-semibold text-white">{new Date(selectedDate).toLocaleDateString()} at {selectedTime}</p>
                  
                  <p className="text-sm text-slate-500 mb-1 mt-4">Address</p>
                  <p className="font-semibold text-white truncate">{addresses.find(a => a.address_id === selectedAddressId)?.title}</p>
                </div>
              </div>

              <div className="mt-6">
                <label className="block text-sm text-slate-500 mb-1">Any specific notes for the provider? (Optional)</label>
                <textarea 
                  rows="2" 
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="e.g. Please bring a ladder..."
                  className="w-full bg-slate-900 border border-slate-700 rounded p-3 text-white focus:border-amber-500 focus:outline-none"
                ></textarea>
              </div>
            </div>

            <div className="flex justify-between pt-4">
              <button 
                onClick={() => setStep(2)}
                className="bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 px-6 rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50"
                disabled={submitting}
              >
                <ArrowLeft size={18} /> Back
              </button>
              <button 
                onClick={handleConfirmBooking}
                disabled={submitting}
                className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold py-3 px-8 rounded-lg flex items-center gap-2 transition-all shadow-lg shadow-green-500/20 disabled:opacity-50"
              >
                {submitting ? 'Confirming...' : 'Confirm Booking'} <CheckCircle size={18} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BookingWizardPage;
