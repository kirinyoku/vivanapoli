import Sidebar from '@/components/Sidebar';
import MenuContent from '@/components/MenuContent';
import CartPanel from '@/components/CartPanel';

export default function Home() {
  return (
    <div className="grid h-screen grid-cols-1 overflow-hidden lg:grid-cols-[280px_1fr_340px]">
      <Sidebar />
      <main className="h-full overflow-hidden bg-bg-page">
        <MenuContent />
      </main>
      <CartPanel />
    </div>
  );
}
