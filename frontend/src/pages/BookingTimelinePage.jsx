import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { Clock, CheckCircle, PlayCircle, XCircle, FileText, MapPin, Calendar, User, ArrowLeft, ArrowRight } from 'lucide-react';

const BookingTimelinePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState(null);
  const [review, setReview] = useState(null);
  const [paymentStatus, setPaymentStatus] = useState(null); // null | {paid, status, ...}
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [payLoading, setPayLoading] = useState(false);
  
  // Review form state
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    const fetchBooking = async () => {
      try {
        const res = await api.get(`/bookings/${id}`);
        setBooking(res.data);
        
        if (res.data.status === 'completed') {
          // Fetch existing review
          try {
            const revRes = await api.get(`/bookings/${id}/review`);
            setReview(revRes.data);
          } catch (e) {
            // No review found (404) is expected if not reviewed yet
          }
          // Fetch payment status
          try {
            const payRes = await api.get(`/payments/status/${id}`);
            setPaymentStatus(payRes.data);
          } catch (e) {
            setPaymentStatus({ paid: false, status: null });
          }
        }
      } catch (err) {
        setError('Failed to load booking details.');
      } finally {
        setLoading(false);
      }
    };
    fetchBooking();
  }, [id]);

  const handleCancelBooking = async () => {
    if (!window.confirm("Are you sure you want to cancel this booking?")) return;
    setCancelLoading(true);
    try {
      await api.patch(`/bookings/${id}/status`, { status: 'cancelled' });
      // Refresh
      const res = await api.get(`/bookings/${id}`);
      setBooking(res.data);
    } catch (err) {
      alert("Failed to cancel booking.");
    } finally {
      setCancelLoading(false);
    }
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    setSubmittingReview(true);
    try {
      const payload = { booking_id: id, rating, comment };
      const res = await api.post('/reviews', payload);
      setReview(res.data);
      alert("Review submitted successfully!");
    } catch (err) {
      alert(err.response?.data?.detail || "Failed to submit review.");
    } finally {
      setSubmittingReview(false);
    }
  };

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if (window.Razorpay) { resolve(true); return; }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handlePayNow = async () => {
    setPayLoading(true);
    try {
      const loaded = await loadRazorpayScript();
      if (!loaded) {
        alert('Failed to load payment gateway. Please check your internet connection.');
        return;
      }

      const { data: order } = await api.post('/payments/initiate', { booking_id: id });

      const options = {
        key: order.razorpay_key,
        amount: order.amount,
        currency: order.currency,
        name: 'GharSeva',
        description: 'Home Service Payment',
        order_id: order.order_id,
        prefill: order.prefill,
        theme: { color: '#F59E0B' },
        handler: async (response) => {
          try {
            await api.post('/payments/verify', {
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature,
            });
            setPaymentStatus({ paid: true, status: 'captured', amount: order.amount / 100 });
            alert('🎉 Payment successful! Your invoice is ready to download.');
          } catch (err) {
            alert(err.response?.data?.detail || 'Payment verification failed.');
          }
        },
        modal: {
          ondismiss: () => setPayLoading(false)
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to initiate payment.');
    } finally {
      setPayLoading(false);
    }
  };

  const handleDownloadInvoice = async () => {
    try {
      const response = await api.get(`/payments/${id}/invoice`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `gharseva-invoice-${id.slice(0, 8)}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert('Failed to download invoice.');
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12 flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-amber-500"></div>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <h2 className="text-2xl font-bold text-red-500 mb-4">{error || "Booking not found"}</h2>
        <Link to="/customer/dashboard" className="text-amber-500 hover:underline">Return to Dashboard</Link>
      </div>
    );
  }

  const statusFlow = [
    { id: 'pending', label: 'Requested', icon: Clock },
    { id: 'confirmed', label: 'Confirmed', icon: CheckCircle },
    { id: 'in_progress', label: 'In Progress', icon: PlayCircle },
    { id: 'completed', label: 'Completed', icon: CheckCircle }
  ];

  const currentStatusIndex = statusFlow.findIndex(s => s.id === booking.status);
  const isCancelled = booking.status === 'cancelled';

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <button onClick={() => navigate('/customer/dashboard')} className="flex items-center gap-2 text-amber-500 hover:text-amber-400 mb-6 transition-colors font-medium">
        <ArrowLeft size={18} /> Back to Dashboard
      </button>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-1">Booking Tracker</h1>
          <p className="text-slate-400 font-mono text-sm">ID: {booking.booking_id}</p>
        </div>
        <div className={`px-4 py-1.5 rounded-full border text-sm font-bold uppercase tracking-wider
          ${isCancelled ? 'bg-red-500/10 border-red-500/50 text-red-500' 
            : booking.status === 'completed' ? 'bg-green-500/10 border-green-500/50 text-green-500' 
            : 'bg-amber-500/10 border-amber-500/50 text-amber-500'}`}
        >
          {booking.status.replace('_', ' ')}
        </div>
      </div>

      {/* Progress Tracker */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 mb-8 shadow-xl">
        {isCancelled ? (
          <div className="flex flex-col items-center justify-center py-6 text-red-500">
            <XCircle size={64} className="mb-4 opacity-80" />
            <h2 className="text-xl font-bold">Booking Cancelled</h2>
            <p className="text-slate-400 mt-2">This booking request was cancelled and will not be fulfilled.</p>
          </div>
        ) : (
          <div className="relative">
            {/* Connecting line background */}
            <div className="absolute top-1/2 left-0 right-0 h-1 bg-slate-800 -translate-y-1/2 hidden md:block z-0"></div>
            
            {/* Active connecting line */}
            <div 
              className="absolute top-1/2 left-0 h-1 bg-amber-500 -translate-y-1/2 hidden md:block z-0 transition-all duration-500"
              style={{ width: `${(Math.max(0, currentStatusIndex) / (statusFlow.length - 1)) * 100}%` }}
            ></div>

            <div className="relative z-10 flex flex-col md:flex-row justify-between gap-6">
              {statusFlow.map((step, index) => {
                const isCompleted = index <= currentStatusIndex;
                const isCurrent = index === currentStatusIndex;
                const Icon = step.icon;
                
                return (
                  <div key={step.id} className="flex flex-row md:flex-col items-center gap-4 md:gap-3 flex-1">
                    <div className={`
                      w-12 h-12 rounded-full flex items-center justify-center border-4 transition-all duration-300
                      ${isCompleted 
                        ? 'bg-amber-500 border-amber-500 text-slate-950 shadow-[0_0_15px_rgba(245,158,11,0.4)]' 
                        : 'bg-slate-900 border-slate-700 text-slate-500'}
                    `}>
                      <Icon size={20} className={isCurrent ? 'animate-pulse' : ''} />
                    </div>
                    <div className="text-left md:text-center">
                      <p className={`font-bold ${isCompleted ? 'text-white' : 'text-slate-500'}`}>{step.label}</p>
                      <p className="text-xs text-slate-500 mt-1 hidden md:block">
                        {isCurrent ? 'Current Phase' : isCompleted ? 'Done' : 'Pending'}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Details Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg">
          <h3 className="text-lg font-bold text-white mb-4 border-b border-slate-800 pb-2">Service Details</h3>
          
          <ul className="space-y-4">
            <li className="flex gap-3">
              <FileText className="text-slate-500 shrink-0" size={20} />
              <div>
                <p className="text-sm text-slate-400">Service</p>
                <p className="font-semibold text-white">{booking.service?.name}</p>
              </div>
            </li>
            <li className="flex gap-3">
              <User className="text-slate-500 shrink-0" size={20} />
              <div>
                <p className="text-sm text-slate-400">Professional</p>
                <p className="font-semibold text-white">{booking.provider?.full_name}</p>
              </div>
            </li>
            <li className="flex gap-3">
              <Calendar className="text-slate-500 shrink-0" size={20} />
              <div>
                <p className="text-sm text-slate-400">Scheduled Date & Time</p>
                <p className="font-semibold text-white">{new Date(booking.scheduled_at).toLocaleString()}</p>
              </div>
            </li>
            <li className="flex gap-3">
              <MapPin className="text-slate-500 shrink-0" size={20} />
              <div>
                <p className="text-sm text-slate-400">Location</p>
                <p className="font-semibold text-white">{booking.address?.address_text}</p>
              </div>
            </li>
          </ul>

          {booking.notes && (
            <div className="mt-4 pt-4 border-t border-slate-800">
              <p className="text-sm text-slate-400 mb-1">Your Notes</p>
              <p className="text-slate-300 italic">"{booking.notes}"</p>
            </div>
          )}
        </div>

        {/* Payment & Actions Card */}
        <div className="space-y-8">
          <div className="bg-slate-950 border border-slate-700 rounded-xl p-6 shadow-lg">
            <h3 className="text-lg font-bold text-white mb-4 border-b border-slate-800 pb-2">Payment Summary</h3>
            
            <div className="flex justify-between items-center mb-3">
              <span className="text-slate-400">Service Base</span>
              <span className="text-white">₹{booking.total_amount}</span>
            </div>
            
            <div className="flex justify-between items-center pt-3 border-t border-slate-800">
              <span className="text-lg font-bold text-white">Total Estimated</span>
              <span className="text-2xl font-black text-amber-500">₹{booking.total_amount}</span>
            </div>
            
            <div className="mt-6">
              {booking.status === 'completed' ? (
                paymentStatus?.paid ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-center gap-2 text-green-400 font-bold">
                      <CheckCircle size={18} className="fill-green-400/20" />
                      Payment Complete
                    </div>
                    <button
                      onClick={handleDownloadInvoice}
                      className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-950 font-bold py-3 rounded-lg flex items-center justify-center gap-2 shadow-lg transition-all"
                    >
                      <FileText size={18} /> Download Invoice
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={handlePayNow}
                    disabled={payLoading}
                    className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 shadow-lg transition-all disabled:opacity-60"
                  >
                    {payLoading ? (
                      <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Processing...</>
                    ) : (
                      <>Pay Now <ArrowRight size={18} /></>
                    )}
                  </button>
                )
              ) : (
                <div className="text-center p-3 bg-slate-900 border border-slate-800 rounded-lg text-sm text-slate-400">
                  Payment becomes available once the service is completed.
                </div>
              )}
            </div>
          </div>

          {/* Cancellation */}
          {booking.status === 'pending' && (
            <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-6">
              <h3 className="text-red-500 font-bold mb-2">Need to cancel?</h3>
              <p className="text-sm text-slate-400 mb-4">You can cancel your booking request freely while it's still pending provider confirmation.</p>
              <button 
                onClick={handleCancelBooking}
                disabled={cancelLoading}
                className="text-red-500 font-semibold text-sm hover:underline disabled:opacity-50"
              >
                {cancelLoading ? 'Cancelling...' : 'Cancel Booking'}
              </button>
            </div>
          )}

          {/* Review Section */}
          {booking.status === 'completed' && (
            <div className="bg-slate-900 border border-amber-500/30 rounded-xl p-6 shadow-lg">
              <h3 className="text-lg font-bold text-amber-500 mb-4">Service Review</h3>
              
              {review ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map(star => (
                      <span key={star} className={`text-xl ${star <= review.rating ? 'text-amber-500' : 'text-slate-700'}`}>★</span>
                    ))}
                  </div>
                  {review.comment && <p className="text-slate-300 italic">"{review.comment}"</p>}
                  {review.reply && (
                    <div className="bg-slate-800 p-4 rounded-lg mt-4 border-l-4 border-amber-500">
                      <p className="text-xs text-slate-400 mb-1 font-semibold">Provider Reply:</p>
                      <p className="text-sm text-slate-300">{review.reply}</p>
                    </div>
                  )}
                </div>
              ) : (
                <form onSubmit={handleSubmitReview} className="space-y-4">
                  <div>
                    <label className="block text-sm text-slate-400 mb-2">Rating</label>
                    <div className="flex items-center gap-2">
                      {[1, 2, 3, 4, 5].map(star => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setRating(star)}
                          className={`text-2xl hover:scale-110 transition-transform ${star <= rating ? 'text-amber-500' : 'text-slate-700'}`}
                        >
                          ★
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm text-slate-400 mb-2">Comment (Optional)</label>
                    <textarea 
                      value={comment}
                      onChange={e => setComment(e.target.value)}
                      rows="3"
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white focus:border-amber-500 focus:outline-none"
                      placeholder="How was your experience?"
                    ></textarea>
                  </div>
                  <button 
                    type="submit"
                    disabled={submittingReview}
                    className="w-full bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold py-2 rounded-lg transition-colors disabled:opacity-50"
                  >
                    {submittingReview ? 'Submitting...' : 'Submit Review'}
                  </button>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BookingTimelinePage;
