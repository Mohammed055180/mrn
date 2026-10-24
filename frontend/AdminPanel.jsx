import React, { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Check, KeyRound, RefreshCw, ShieldCheck, X } from 'lucide-react';

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = url && key ? createClient(url, key) : null;

export default function AdminPanel() {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [admin, setAdmin] = useState(false);
  const [items, setItems] = useState([]);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');

  const refresh = async () => {
    if (!supabase) return;
    setBusy(true);
    setNotice('');
    const { data: { user } } = await supabase.auth.getUser();
    const allowed = user?.app_metadata?.role === 'admin';
    setAdmin(allowed);
    if (!allowed) {
      setItems([]);
      setBusy(false);
      setNotice(user ? 'هذا الحساب ليس لديه صلاحية المشرف.' : 'سجّل الدخول بحساب المشرف.');
      return;
    }
    const { data, error } = await supabase.from('listings')
      .select('id,title,city,district,price,type,purpose,beds,baths,area,image,created_at')
      .eq('status', 'pending').order('created_at', { ascending: true }).limit(100);
    if (error) setNotice('تعذر تحميل الإعلانات. تحقق من صلاحيات قاعدة البيانات.');
    else setItems(data || []);
    setBusy(false);
  };

  useEffect(() => {
    if (open) refresh();
  }, [open]);

  const signIn = async (event) => {
    event.preventDefault();
    if (!supabase) return setNotice('إعدادات Supabase غير متاحة.');
    setBusy(true);
    setNotice('');
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setBusy(false);
    if (error) return setNotice('تعذر تسجيل الدخول. تحقق من البريد وكلمة المرور.');
    setPassword('');
    await refresh();
  };

  const review = async (id, status) => {
    if (!supabase || !admin) return;
    setBusy(true);
    setNotice('');
    const { error } = await supabase.from('listings').update({ status, updated_at: new Date().toISOString() })
      .eq('id', id).eq('status', 'pending');
    setBusy(false);
    if (error) return setNotice('لم يتغير الإعلان. تحقق من صلاحيات المشرف وحاول مجدداً.');
    setItems(current => current.filter(item => item.id !== id));
    setNotice(status === 'published' ? 'تم اعتماد الإعلان ونشره.' : 'تم رفض الإعلان.');
    window.dispatchEvent(new Event('dar:listings-updated'));
  };

  return <>
    <button className="admin-entry" onClick={() => { setOpen(true); setNotice(''); }}>
      <ShieldCheck size={14} /> مراجعة الإعلانات
    </button>
    {open && <div className="modal-backdrop admin-backdrop" onMouseDown={e => e.target === e.currentTarget && setOpen(false)}>
      <section className="admin-panel" dir="rtl" aria-labelledby="admin-heading">
        <div className="admin-panel-head">
          <div><span className="eyebrow muted">إدارة دار</span><h2 id="admin-heading">مراجعة الإعلانات</h2>
            <p>{admin ? 'الإعلانات الجديدة تنتظر قرارك.' : 'هذه الصفحة للمشرفين فقط.'}</p></div>
          <button className="close" onClick={() => setOpen(false)} aria-label="إغلاق"><X /></button>
        </div>
        {admin ? <>
          <div className="admin-toolbar"><span>{items.length} إعلان قيد المراجعة</span><button className="outline" disabled={busy} onClick={refresh}><RefreshCw size={15} /> تحديث</button></div>
          {items.length ? <div className="admin-list">{items.map(item => <article className="admin-card" key={item.id}>
            {item.image && <img src={item.image} alt="صورة العقار" />}
            <div className="admin-card-info"><strong>{item.title}</strong><span>{item.city} · {item.district}</span>
              <span>{new Intl.NumberFormat('ar-SA').format(item.price)} ر.س · {item.type} · {item.purpose}</span>
              <span>{item.area} م² · {item.beds} غرف · {item.baths} حمامات</span>
              <small>{new Date(item.created_at).toLocaleString('ar-SA')}</small>
            </div>
            <div className="admin-card-actions"><button className="primary" disabled={busy} onClick={() => review(item.id, 'published')}><Check size={15} /> اعتماد ونشر</button>
              <button className="admin-reject" disabled={busy} onClick={() => review(item.id, 'rejected')}><X size={15} /> رفض</button></div>
          </article>)}</div> : <p className="empty">لا توجد إعلانات بانتظار المراجعة.</p>}
        </> : <form className="admin-login" onSubmit={signIn}>
          <label>البريد الإلكتروني<input type="email" required autoComplete="username" value={email} onChange={e => setEmail(e.target.value)} /></label>
          <label>كلمة المرور<input type="password" required autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)} /></label>
          <button className="primary submit" disabled={busy}><KeyRound size={16} /> {busy ? 'جارٍ التحقق...' : 'دخول المشرف'}</button>
          <small>تحتاج إلى حساب Supabase مفعل وصلاحية مشرف من مسؤول المشروع.</small>
        </form>}
        {notice && <p className="admin-notice" role="status">{notice}</p>}
      </section>
    </div>}
  </>;
}
