import { Bell, Package, Tag, Info, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function NotificationsPage() {
  const notifications = [
    {
      id: 1,
      title: 'Order Preparing',
      message: 'Your order #GO-8492 is currently being prepared by our chefs.',
      time: '10 mins ago',
      icon: Package,
      type: 'order',
      read: false
    },
    {
      id: 2,
      title: 'Weekend Special',
      message: 'Get 15% off on all Pizzas this weekend! Use code PIZZA15.',
      time: '2 hours ago',
      icon: Tag,
      type: 'promo',
      read: false
    },
    {
      id: 3,
      title: 'New AR Feature',
      message: 'Experience our dishes in 3D AR before ordering! Look for the 3D cube icon.',
      time: '1 day ago',
      icon: Info,
      type: 'system',
      read: true
    }
  ];

  return (
    <div className="min-h-screen bg-obsidian text-text-primary pb-24 pt-20 px-4">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/" className="w-10 h-10 rounded-full bg-white/5 border border-border-subtle flex items-center justify-center text-text-primary/50 hover:text-text-primary transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-2xl font-serif text-champagne">Notifications</h1>
      </div>

      <div className="space-y-4">
        {notifications.map((notif) => (
          <div 
            key={notif.id} 
            className={`p-4 rounded-xl border ${notif.read ? 'bg-[#1a1a1a] border-white/5' : 'bg-primary/5 border-primary/20'} flex gap-4 transition-all`}
          >
            <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${notif.read ? 'bg-white/5 text-text-primary/40' : 'bg-primary/20 text-primary'}`}>
              <notif.icon className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <div className="flex justify-between items-start mb-1">
                <h3 className={`font-medium ${notif.read ? 'text-text-primary/80' : 'text-primary'}`}>{notif.title}</h3>
                <span className="text-[10px] text-text-primary/40">{notif.time}</span>
              </div>
              <p className="text-sm text-text-primary/60 leading-relaxed">{notif.message}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
