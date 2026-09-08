import React, { useEffect, useState, useMemo, useRef } from "react";
import {
  getProperties, getProperty, createRequest, createProperty, uploadImages,
  adminLogin, getAdminRequests, updateAdminRequestStatus,
  getPendingProperties, approveProperty, toggleFeatured,
  deleteProperty, getRequestsCsv
} from "./api";
import {
  Building2, Search, SlidersHorizontal, MapPin, Ruler,
  Phone, MessageCircle, Star, ShieldCheck, LayoutDashboard, CheckCircle2,
  Clock, ImagePlus, X, Lock, Send,
  ChevronLeft, Trash2, Pin,
  LogOut, ArrowUpLeft, TrendingUp, Users, Award, Calculator, Menu,
  Layers, ShieldAlert, FileDown, Eye, RotateCcw
} from "lucide-react";

/* ============================= Static data ============================= */

const CITIES = ["الرياض", "جدة", "الدمام", "مكة المكرمة", "المدينة المنورة", "الخبر", "الطائف", "أبها", "تبوك", "الأحساء"];
const PROPERTY_TYPES = ["شقة", "فيلا", "دور", "أرض", "عمارة سكنية", "مكتب تجاري", "محل تجاري", "استراحة"];
const OFFER_TYPES = [{ value: "sale", label: "بيع" }, { value: "rent", label: "إيجار" }];
const AGE_OPTIONS = ["جديد (تحت الإنشاء)", "أقل من 5 سنوات", "5 - 10 سنوات", "أكثر من 10 سنوات"];
const FACADE_OPTIONS = ["واجهة واحدة", "واجهتان", "ثلاث واجهات", "أربع واجهات (زاوية)"];
const AMENITIES_LIST = ["مسبح", "مصعد", "موقف سيارات مغطى", "حديقة خاصة", "غرفة خادمة", "نظام أمني ومراقبة", "تكييف مركزي", "مطبخ راكب"];
const REQUEST_STATUSES = [
  { value: "pending", label: "قيد المتابعة", tone: "gold" },
  { value: "fulfilled", label: "تم التوفير", tone: "green" },
  { value: "cancelled", label: "ملغى", tone: "red" },
];
const WHATSAPP_NUMBER = "966500000000";

const NAVY = "#0E1E3B";
const NAVY_DEEP = "#091529";
const GOLD = "#AD8A52";
const SLATE = "#3E5C78";

/* ============================= Small atoms ============================= */

function ToneBadge({ tone = "gold", children, icon: Icon }) {
  const map = {
    gold: "bg-[#F4ECDD] text-[#8A6C34] border-[#E2CFA0]",
    green: "bg-[#E7F2EB] text-[#356248] border-[#BFDDC9]",
    red: "bg-[#F7E9E9] text-[#8F3D3D] border-[#E7C3C3]",
    navy: "bg-[#E9ECF3] text-[#0E1E3B] border-[#C6CEE0]",
  };
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-sm border ${map[tone]}`}>
      {Icon && <Icon size={13} />}
      {children}
    </span>
  );
}

function FieldShell({ label, required, children, hint }) {
  return (
    <label className="block mb-5">
      <span className="block mb-1.5 text-sm font-medium text-[#1A2233]">
        {label}{required && <span className="text-[#A64B4B] mr-1">*</span>}
      </span>
      {children}
      {hint && <span className="block mt-1 text-xs text-[#6B7280]">{hint}</span>}
    </label>
  );
}

const inputBase = "w-full rounded-sm border bg-white px-3.5 py-2.5 text-sm text-[#1A2233] outline-none transition focus:border-[#0E1E3B] focus:ring-1 focus:ring-[#0E1E3B]";
function TextInput({ error, ...props }) {
  return <input {...props} className={`${inputBase} ${error ? "border-[#A64B4B]" : "border-[#D6DAE3]"}`} />;
}
function TextArea({ error, ...props }) {
  return <textarea {...props} className={`${inputBase} ${error ? "border-[#A64B4B]" : "border-[#D6DAE3]"} min-h-[110px] resize-y`} />;
}
function Select({ error, children, ...props }) {
  return <select {...props} className={`${inputBase} ${error ? "border-[#A64B4B]" : "border-[#D6DAE3]"}`}>{children}</select>;
}

function PrimaryButton({ children, icon: Icon, className = "", ...props }) {
  return (
    <button {...props} className={`inline-flex items-center justify-center gap-2 bg-[#0E1E3B] text-white text-sm font-semibold px-6 py-3 rounded-sm hover:bg-[#132A50] transition disabled:opacity-50 disabled:cursor-not-allowed ${className}`}>
      {Icon && <Icon size={17} />}{children}
    </button>
  );
}
function GoldButton({ children, icon: Icon, className = "", ...props }) {
  return (
    <button {...props} className={`inline-flex items-center justify-center gap-2 border border-[#AD8A52] text-[#8A6C34] text-sm font-semibold px-6 py-3 rounded-sm hover:bg-[#AD8A52] hover:text-white transition ${className}`}>
      {Icon && <Icon size={17} />}{children}
    </button>
  );
}
function GhostButton({ children, icon: Icon, className = "", ...props }) {
  return (
    <button {...props} className={`inline-flex items-center justify-center gap-2 text-[#0E1E3B] text-sm font-medium px-4 py-2 rounded-sm border border-[#D6DAE3] hover:border-[#0E1E3B] transition ${className}`}>
      {Icon && <Icon size={16} />}{children}
    </button>
  );
}

/* ============================= NavBar ============================= */

function NavBar({ view, setView }) {
  const [open, setOpen] = useState(false);
  const links = [
    { id: "home", label: "الرئيسية" },
    { id: "properties", label: "العقارات المعروضة" },
    { id: "request", label: "اطلب عقاراً" },
    { id: "list", label: "اعرض عقارك" },
    { id: "calculator", label: "حاسبة التمويل" },
  ];
  return (
    <header className="sticky top-0 z-40 bg-[#0E1E3B] text-white shadow-[0_1px_0_0_rgba(173,138,82,0.4)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <button onClick={() => setView("home")} className="flex items-center gap-2.5">
          <span className="flex items-center justify-center w-9 h-9 rounded-sm bg-[#AD8A52]">
            <Building2 size={19} className="text-[#0E1E3B]" />
          </span>
          <span className="font-bold text-lg tracking-tight" style={{ fontFamily: "'Almarai', sans-serif" }}>الديار العقارية</span>
        </button>

        <nav className="hidden lg:flex items-center gap-1">
          {links.map(l => (
            <button key={l.id} onClick={() => setView(l.id)}
              className={`px-4 py-2 text-sm rounded-sm transition ${view === l.id ? "text-[#AD8A52] font-semibold" : "text-white/85 hover:text-white"}`}>
              {l.label}
            </button>
          ))}
        </nav>

        <div className="hidden lg:flex items-center gap-3">
          <a href={waLink(WHATSAPP_NUMBER, "مرحباً، أرغب في الاستفسار عن خدماتكم العقارية.")} target="_blank" rel="noreferrer"
            className="flex items-center gap-2 text-sm text-white/90 hover:text-white border border-white/25 px-3.5 py-2 rounded-sm">
            <MessageCircle size={16} /> تواصل واتساب
          </a>
          <button onClick={() => setView("admin")} title="لوحة الإدارة"
            className={`p-2.5 rounded-sm border ${view === "admin" ? "border-[#AD8A52] text-[#AD8A52]" : "border-white/25 text-white/70 hover:text-white"}`}>
            <Lock size={16} />
          </button>
        </div>

        <button onClick={() => setOpen(o => !o)} className="lg:hidden p-2 text-white">
          <Menu size={22} />
        </button>
      </div>

      {open && (
        <div className="lg:hidden bg-[#0A1730] border-t border-white/10 px-4 py-3 flex flex-col gap-1">
          {links.map(l => (
            <button key={l.id} onClick={() => { setView(l.id); setOpen(false); }}
              className={`text-right px-3 py-2.5 rounded-sm text-sm ${view === l.id ? "text-[#AD8A52] font-semibold" : "text-white/85"}`}>
              {l.label}
            </button>
          ))}
          <button onClick={() => { setView("admin"); setOpen(false); }} className="text-right px-3 py-2.5 rounded-sm text-sm text-white/70 flex items-center gap-2">
            <Lock size={14} /> لوحة الإدارة
          </button>
        </div>
      )}
    </header>
  );
}

/* ============================= Home ============================= */

function HomePage({ properties, setView, openProperty }) {
  const featured = properties.filter(p => p.status === "published").sort((a, b) => (b.featured - a.featured) || new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 3);
  const stats = [
    { icon: Building2, value: `${properties.filter(p => p.status === "published").length}+`, label: "عقار معروض حالياً" },
    { icon: Users, value: "1200+", label: "عميل تمت خدمته" },
    { icon: Award, value: "12", label: "عاماً من الخبرة" },
    { icon: ShieldCheck, value: "100%", label: "سرية في طلبات الشراء" },
  ];
  return (
    <div>
      {/* Hero */}
      <section className="bg-[#0E1E3B] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-16 pb-20 lg:pt-24 lg:pb-28">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-2 text-[#D9C48F] text-sm font-medium mb-5">
              <ShieldCheck size={16} /> منصة عقارية موثوقة لإدارة عمليات البيع والشراء والإيجار
            </span>
            <h1 className="text-4xl lg:text-5xl font-extrabold leading-[1.3] mb-6" style={{ fontFamily: "'Almarai', sans-serif" }}>
              نوفر لك العقار المناسب، ونعرض عقارك للجهة المناسبة
            </h1>
            <p className="text-white/75 text-base lg:text-lg leading-loose mb-9 max-w-xl">
              سواء كنت تبحث عن عقار بمواصفات محددة أو تملك عقاراً وتريد تسويقه باحترافية، فريقنا يتولى الأمر بخصوصية تامة ودقة في التنفيذ.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <PrimaryButton icon={Send} onClick={() => setView("request")} className="!bg-[#AD8A52] hover:!bg-[#96763E] !text-[#0E1E3B]">
                اطلب عقاراً بخصوصية
              </PrimaryButton>
              <GhostButton icon={ArrowUpLeft} onClick={() => setView("list")} className="!border-white/30 !text-white hover:!border-white">
                اعرض عقارك للبيع أو الإيجار
              </GhostButton>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-[#0A1730] border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 grid grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((s, i) => (
            <div key={i} className="flex items-center gap-3.5">
              <span className="flex items-center justify-center w-11 h-11 rounded-sm bg-white/10 text-[#D9C48F] shrink-0">
                <s.icon size={20} />
              </span>
              <div>
                <div className="text-xl font-bold text-white">{s.value}</div>
                <div className="text-xs text-white/60">{s.label}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Two paths */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
        <div className="grid md:grid-cols-2 gap-6">
          <div className="border border-[#D6DAE3] bg-white p-8 rounded-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 w-1.5 h-full bg-[#0E1E3B]" />
            <ShieldCheck size={26} className="text-[#0E1E3B] mb-4" />
            <h3 className="text-xl font-bold mb-2.5" style={{ fontFamily: "'Almarai', sans-serif" }}>تبحث عن عقار بمواصفات خاصة؟</h3>
            <p className="text-[#4B5563] text-sm leading-relaxed mb-6">
              أرسل طلبك بالمواصفات التي تريدها. يصل الطلب مباشرة لفريقنا فقط، ولا يظهر لأي زائر آخر على الموقع.
            </p>
            <GoldButton icon={Send} onClick={() => setView("request")}>تقديم طلب عقار</GoldButton>
          </div>
          <div className="border border-[#D6DAE3] bg-white p-8 rounded-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 w-1.5 h-full bg-[#AD8A52]" />
            <TrendingUp size={26} className="text-[#AD8A52] mb-4" />
            <h3 className="text-xl font-bold mb-2.5" style={{ fontFamily: "'Almarai', sans-serif" }}>تملك عقاراً وتريد تسويقه؟</h3>
            <p className="text-[#4B5563] text-sm leading-relaxed mb-6">
              أضف بيانات عقارك وصوره، وبعد مراجعة سريعة سيظهر في صفحة العقارات المعروضة لجميع الزوار المهتمين.
            </p>
            <GoldButton icon={ArrowUpLeft} onClick={() => setView("list")}>عرض عقار جديد</GoldButton>
          </div>
        </div>
      </section>

      {/* Featured */}
      {featured.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-16">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold" style={{ fontFamily: "'Almarai', sans-serif" }}>عقارات مميزة</h2>
            <button onClick={() => setView("properties")} className="text-sm text-[#0E1E3B] font-medium flex items-center gap-1.5 hover:text-[#AD8A52]">
              عرض كل العقارات <ChevronLeft size={16} />
            </button>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {featured.map(p => <PropertyCard key={p.id} p={p} onOpen={openProperty} />)}
          </div>
        </section>
      )}

      {/* Trust */}
      <section className="bg-white border-t border-[#E5E7EB]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16 grid md:grid-cols-3 gap-8">
          {[
            { icon: ShieldCheck, title: "خصوصية تامة", text: "طلبات الشراء لا تُعرض للعامة أبداً، وتصل حصرياً لإدارة المبيعات." },
            { icon: Layers, title: "عروض موثقة", text: "كل عقار معروض يمر بمراجعة سريعة قبل نشره للزوار." },
            { icon: Calculator, title: "أدوات مساعدة", text: "حاسبة تمويل تقريبية تساعدك على تقدير قسطك الشهري فوراً." },
          ].map((f, i) => (
            <div key={i} className="flex gap-4">
              <span className="flex items-center justify-center w-12 h-12 rounded-sm bg-[#F4ECDD] text-[#8A6C34] shrink-0">
                <f.icon size={22} />
              </span>
              <div>
                <h4 className="font-bold mb-1.5">{f.title}</h4>
                <p className="text-sm text-[#6B7280] leading-relaxed">{f.text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

/* ============================= Property Card / Modal ============================= */

function PropertyCard({ p, onOpen }) {
  return (
    <div className="bg-white border border-[#E5E7EB] rounded-sm overflow-hidden group">
      <div className="relative h-48 overflow-hidden">
        <img src={p.images[0]} alt={p.propertyType} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
        <div className="absolute top-3 right-3 flex gap-2">
          <ToneBadge tone={p.offerType === "sale" ? "navy" : "gold"}>{p.offerType === "sale" ? "للبيع" : "للإيجار"}</ToneBadge>
        </div>
        {p.featured && (
          <div className="absolute top-3 left-3">
            <ToneBadge tone="gold" icon={Star}>مميز</ToneBadge>
          </div>
        )}
      </div>
      <div className="p-5">
        <div className="flex items-start justify-between gap-3 mb-2">
          <h3 className="font-bold text-[#0E1E3B]">{p.propertyType} - {p.district}</h3>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-[#6B7280] mb-4">
          <MapPin size={13} /> {p.city}
        </div>
        <div className="flex items-center gap-4 text-xs text-[#4B5563] mb-5 border-t border-[#F0F1F3] pt-4">
          <span className="flex items-center gap-1"><Ruler size={13} /> {formatArea(p.area)}</span>
          <span className="flex items-center gap-1"><Layers size={13} /> {p.facades}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-lg font-extrabold text-[#0E1E3B]">{formatSAR(p.price)}</span>
          <button onClick={() => onOpen(p)} className="text-sm font-semibold text-[#AD8A52] flex items-center gap-1 hover:gap-1.5 transition-all">
            التفاصيل <ChevronLeft size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}

function PropertyModal({ p, onClose }) {
  const [imgIdx, setImgIdx] = useState(0);
  const msg = `مرحباً، أرغب في الاستفسار عن العقار التالي:\n${p.propertyType} - ${p.district}، ${p.city}\nالسعر: ${formatSAR(p.price)}`;
  return (
    <div className="fixed inset-0 z-[80] bg-black/60 flex items-start sm:items-center justify-center p-0 sm:p-4 overflow-y-auto" onClick={onClose}>
      <div className="bg-white w-full sm:max-w-3xl sm:rounded-sm overflow-hidden mt-0 sm:my-8" onClick={e => e.stopPropagation()}>
        <div className="relative h-64 sm:h-80 bg-[#0A1730]">
          <img src={p.images[imgIdx]} alt={p.propertyType} className="w-full h-full object-cover" />
          <button onClick={onClose} className="absolute top-3 left-3 bg-white/90 rounded-sm p-1.5"><X size={18} /></button>
          {p.images.length > 1 && (
            <div className="absolute bottom-3 inset-x-0 flex justify-center gap-1.5">
              {p.images.map((_, i) => (
                <button key={i} onClick={() => setImgIdx(i)} className={`w-2 h-2 rounded-full ${i === imgIdx ? "bg-[#AD8A52]" : "bg-white/60"}`} />
              ))}
            </div>
          )}
        </div>
        <div className="p-6 sm:p-8">
          <div className="flex items-center gap-2 mb-3">
            <ToneBadge tone={p.offerType === "sale" ? "navy" : "gold"}>{p.offerType === "sale" ? "للبيع" : "للإيجار"}</ToneBadge>
            {p.featured && <ToneBadge tone="gold" icon={Star}>مميز</ToneBadge>}
          </div>
          <h2 className="text-2xl font-bold mb-1.5" style={{ fontFamily: "'Almarai', sans-serif" }}>{p.propertyType} - {p.district}</h2>
          <p className="text-sm text-[#6B7280] flex items-center gap-1.5 mb-6"><MapPin size={14} /> {p.city}</p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6 border-y border-[#F0F1F3] py-5">
            <div><div className="text-xs text-[#9CA3AF] mb-1">المساحة</div><div className="font-bold text-sm">{formatArea(p.area)}</div></div>
            <div><div className="text-xs text-[#9CA3AF] mb-1">الواجهات</div><div className="font-bold text-sm">{p.facades}</div></div>
            <div><div className="text-xs text-[#9CA3AF] mb-1">عمر العقار</div><div className="font-bold text-sm">{p.age}</div></div>
            <div><div className="text-xs text-[#9CA3AF] mb-1">السعر</div><div className="font-bold text-sm text-[#0E1E3B]">{formatSAR(p.price)}</div></div>
          </div>

          {p.amenities?.length > 0 && (
            <div className="mb-6">
              <div className="text-sm font-bold mb-3">المرافق والمزايا</div>
              <div className="flex flex-wrap gap-2">
                {p.amenities.map((a, i) => <span key={i} className="text-xs bg-[#F4F5F7] border border-[#E5E7EB] px-3 py-1.5 rounded-sm">{a}</span>)}
              </div>
            </div>
          )}

          <div className="mb-8">
            <div className="text-sm font-bold mb-2">تفاصيل إضافية</div>
            <p className="text-sm text-[#4B5563] leading-relaxed">{p.description}</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <a href={waLink(p.contactPhone, msg)} target="_blank" rel="noreferrer" className="flex-1">
              <PrimaryButton icon={MessageCircle} className="w-full !bg-[#3E7C5A] hover:!bg-[#336749]">تواصل عبر واتساب</PrimaryButton>
            </a>
            <a href={`tel:+${p.contactPhone}`} className="flex-1">
              <GhostButton icon={Phone} className="w-full">اتصال مباشر</GhostButton>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============================= Mortgage Calculator ============================= */

function MortgageCalculator({ standalone }) {
  const [price, setPrice] = useState(1000000);
  const [down, setDown] = useState(150000);
  const [rate, setRate] = useState(6.5);
  const [years, setYears] = useState(20);
  const monthly = computeInstallment(Number(price) || 0, Number(down) || 0, Number(rate) || 0, Number(years) || 0);
  const total = monthly * years * 12;

  return (
    <div className={`bg-white border border-[#E5E7EB] rounded-sm p-6 sm:p-8 ${standalone ? "" : ""}`}>
      <div className="flex items-center gap-3 mb-6">
        <span className="flex items-center justify-center w-10 h-10 rounded-sm bg-[#F4ECDD] text-[#8A6C34]"><Calculator size={19} /></span>
        <div>
          <h3 className="font-bold text-lg" style={{ fontFamily: "'Almarai', sans-serif" }}>حاسبة التمويل العقاري التقريبية</h3>
          <p className="text-xs text-[#6B7280]">تقدير مبدئي للقسط الشهري، لا يُعتبر عرض تمويل رسمي</p>
        </div>
      </div>
      <div className="grid sm:grid-cols-2 gap-x-6 gap-y-4 mb-6">
        <FieldShell label="سعر العقار (ريال)">
          <TextInput type="number" min="0" value={price} onChange={e => setPrice(e.target.value)} />
        </FieldShell>
        <FieldShell label="الدفعة الأولى (ريال)">
          <TextInput type="number" min="0" value={down} onChange={e => setDown(e.target.value)} />
        </FieldShell>
        <FieldShell label="نسبة الفائدة/الربح السنوية (%)">
          <TextInput type="number" min="0" step="0.1" value={rate} onChange={e => setRate(e.target.value)} />
        </FieldShell>
        <FieldShell label="مدة التمويل (سنوات)">
          <TextInput type="number" min="1" max="30" value={years} onChange={e => setYears(e.target.value)} />
        </FieldShell>
      </div>
      <div className="bg-[#0E1E3B] rounded-sm p-6 grid sm:grid-cols-2 gap-4 text-white">
        <div>
          <div className="text-xs text-white/60 mb-1">القسط الشهري التقريبي</div>
          <div className="text-2xl font-extrabold text-[#D9C48F]">{formatSAR(monthly)}</div>
        </div>
        <div>
          <div className="text-xs text-white/60 mb-1">إجمالي المبلغ المسدد خلال المدة</div>
          <div className="text-2xl font-extrabold">{formatSAR(total)}</div>
        </div>
      </div>
    </div>
  );
}

/* ============================= Properties listing page ============================= */

function PropertiesPage({ properties, openProperty, loading: initialLoading }) {
  const [filters, setFilters] = useState({ offerType: "all", propertyType: "all", city: "all", minPrice: "", maxPrice: "", sortBy: "newest" });
  const [showFilters, setShowFilters] = useState(false);
  const [results, setResults] = useState(properties);
  const [loading, setLoading] = useState(initialLoading);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    setLoading(true); setError("");
    getProperties(filters).then(data => { if (active) setResults(data); })
      .catch(err => { if (active) setError(err.message || "تعذر تحميل نتائج البحث."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [filters]);

  function update(field, value) { setFilters(f => ({ ...f, [field]: value })); }
  const filtered = results;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-2xl font-bold" style={{ fontFamily: "'Almarai', sans-serif" }}>العقارات المعروضة</h1>
        <button onClick={() => setShowFilters(s => !s)} className="lg:hidden flex items-center gap-1.5 text-sm border border-[#D6DAE3] px-3 py-2 rounded-sm">
          <SlidersHorizontal size={15} /> الفلاتر
        </button>
      </div>
      <p className="text-sm text-[#6B7280] mb-6">{loading ? "جارٍ البحث..." : `${filtered.length} نتيجة مطابقة لبحثك`}</p>
      {error && <div className="mb-5 border border-[#E7C3C3] bg-[#F7E9E9] text-[#8F3D3D] p-3 text-sm rounded-sm">{error}</div>}

      <div className={`grid lg:grid-cols-[260px_1fr] gap-8`}>
        <aside className={`${showFilters ? "block" : "hidden"} lg:block`}>
          <div className="border border-[#E5E7EB] bg-white rounded-sm p-5 sticky top-24">
            <div className="flex items-center gap-2 mb-5 text-[#0E1E3B] font-bold text-sm">
              <SlidersHorizontal size={16} /> تصفية النتائج
            </div>
            <FieldShell label="نوع العرض">
              <Select value={filters.offerType} onChange={e => update("offerType", e.target.value)}>
                <option value="all">الكل</option>
                {OFFER_TYPES.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </Select>
            </FieldShell>
            <FieldShell label="نوع العقار">
              <Select value={filters.propertyType} onChange={e => update("propertyType", e.target.value)}>
                <option value="all">الكل</option>
                {PROPERTY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </Select>
            </FieldShell>
            <FieldShell label="المدينة">
              <Select value={filters.city} onChange={e => update("city", e.target.value)}>
                <option value="all">الكل</option>
                {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
              </Select>
            </FieldShell>
            <div className="grid grid-cols-2 gap-3">
              <FieldShell label="السعر من">
                <TextInput type="number" placeholder="0" value={filters.minPrice} onChange={e => update("minPrice", e.target.value)} />
              </FieldShell>
              <FieldShell label="السعر إلى">
                <TextInput type="number" placeholder="بدون حد" value={filters.maxPrice} onChange={e => update("maxPrice", e.target.value)} />
              </FieldShell>
            </div>
            <FieldShell label="ترتيب حسب">
              <Select value={filters.sortBy} onChange={e => update("sortBy", e.target.value)}>
                <option value="newest">الأحدث نشراً</option>
                <option value="price_asc">السعر: من الأقل للأعلى</option>
                <option value="price_desc">السعر: من الأعلى للأقل</option>
                <option value="area_desc">المساحة: من الأكبر للأصغر</option>
              </Select>
            </FieldShell>
            <button onClick={() => setFilters({ offerType: "all", propertyType: "all", city: "all", minPrice: "", maxPrice: "", sortBy: "newest" })}
              className="w-full flex items-center justify-center gap-1.5 text-xs text-[#6B7280] mt-1 py-2 hover:text-[#0E1E3B]">
              <RotateCcw size={13} /> إعادة تعيين الفلاتر
            </button>
          </div>
        </aside>

        <div>
          {filtered.length === 0 ? (
            <div className="border border-dashed border-[#D6DAE3] rounded-sm py-20 text-center">
              <Search size={30} className="mx-auto text-[#9CA3AF] mb-3" />
              <p className="text-sm text-[#6B7280]">لا توجد عقارات مطابقة لمعايير البحث الحالية</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {filtered.map(p => <PropertyCard key={p.id} p={p} onOpen={openProperty} />)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ============================= Request Property Page ============================= */

const emptyRequest = { propertyType: "", city: "", district: "", areaMin: "", areaMax: "", budgetMin: "", budgetMax: "", rooms: "", notes: "", contactName: "", contactPhone: "", contactEmail: "" };

function RequestPropertyPage({ onSubmit }) {
  const [f, setF] = useState(emptyRequest);
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const required = ["propertyType", "city", "contactName", "contactPhone"];

  function update(k, v) { setF(s => ({ ...s, [k]: v })); }
  const [saving, setSaving] = useState(false);
  const [submitError, setSubmitError] = useState("");
  async function handleSubmit() {
    const errs = {};
    required.forEach(k => { if (!String(f[k]).trim()) errs[k] = true; });
    setErrors(errs);
    setSubmitError("");
    if (Object.keys(errs).length > 0) return;
    setSaving(true);
    try {
      await onSubmit(f);
      setSubmitted(true);
    } catch (error) {
      setSubmitError(error.message || "تعذر إرسال الطلب، حاول مرة أخرى.");
    } finally {
      setSaving(false);
    }
  }

  if (submitted) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-24 text-center">
        <span className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#E9ECF3] text-[#0E1E3B] mb-6"><ShieldCheck size={30} /></span>
        <h2 className="text-2xl font-bold mb-3" style={{ fontFamily: "'Almarai', sans-serif" }}>تم استلام طلبكم بسرية تامة</h2>
        <p className="text-[#6B7280] mb-8 leading-relaxed">
          وصل طلبكم مباشرة إلى إدارة المبيعات ولن يظهر على الموقع العام لأي زائر. سيتواصل معكم فريقنا فور توفر عقار مطابق لمواصفاتكم.
        </p>
        <div className="flex justify-center gap-3">
          <GoldButton onClick={() => { setF(emptyRequest); setSubmitted(false); }}>تقديم طلب آخر</GoldButton>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
      <div className="mb-8">
        <ToneBadge tone="navy" icon={ShieldCheck}>هذا الطلب خاص ولا يُنشر للعامة</ToneBadge>
        <h1 className="text-2xl font-bold mt-4 mb-2" style={{ fontFamily: "'Almarai', sans-serif" }}>طلب عقار بمواصفات خاصة</h1>
        <p className="text-sm text-[#6B7280]">عبّر عن احتياجك بدقة، وسيقوم فريقنا بالبحث عن العقار المناسب والتواصل معك مباشرة.</p>
      </div>

      <div className="bg-white border border-[#E5E7EB] rounded-sm p-6 sm:p-8">
        <div className="grid sm:grid-cols-2 gap-x-6">
          <FieldShell label="نوع العقار المطلوب" required>
            <Select value={f.propertyType} error={errors.propertyType} onChange={e => update("propertyType", e.target.value)}>
              <option value="">اختر نوع العقار</option>
              {PROPERTY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </Select>
          </FieldShell>
          <FieldShell label="المدينة" required>
            <Select value={f.city} error={errors.city} onChange={e => update("city", e.target.value)}>
              <option value="">اختر المدينة</option>
              {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
            </Select>
          </FieldShell>
        </div>
        <FieldShell label="الحي المفضل (اختياري)">
          <TextInput value={f.district} onChange={e => update("district", e.target.value)} placeholder="مثال: حي النرجس أو ما يجاوره" />
        </FieldShell>
        <div className="grid sm:grid-cols-2 gap-x-6">
          <FieldShell label="المساحة المطلوبة من (م²)">
            <TextInput type="number" value={f.areaMin} onChange={e => update("areaMin", e.target.value)} />
          </FieldShell>
          <FieldShell label="المساحة المطلوبة إلى (م²)">
            <TextInput type="number" value={f.areaMax} onChange={e => update("areaMax", e.target.value)} />
          </FieldShell>
          <FieldShell label="الميزانية من (ريال)">
            <TextInput type="number" value={f.budgetMin} onChange={e => update("budgetMin", e.target.value)} />
          </FieldShell>
          <FieldShell label="الميزانية إلى (ريال)">
            <TextInput type="number" value={f.budgetMax} onChange={e => update("budgetMax", e.target.value)} />
          </FieldShell>
        </div>
        <FieldShell label="عدد الغرف / الأدوار المطلوبة">
          <TextInput value={f.rooms} onChange={e => update("rooms", e.target.value)} placeholder="مثال: 4 غرف ودورين" />
        </FieldShell>
        <FieldShell label="ملاحظات ومواصفات خاصة">
          <TextArea value={f.notes} onChange={e => update("notes", e.target.value)} placeholder="أي تفاصيل إضافية تساعدنا في اختيار العقار المناسب لكم" />
        </FieldShell>

        <div className="border-t border-[#F0F1F3] pt-6 mt-2">
          <h3 className="text-sm font-bold mb-4">معلومات التواصل</h3>
          <div className="grid sm:grid-cols-2 gap-x-6">
            <FieldShell label="الاسم" required>
              <TextInput value={f.contactName} error={errors.contactName} onChange={e => update("contactName", e.target.value)} />
            </FieldShell>
            <FieldShell label="رقم الجوال" required>
              <TextInput value={f.contactPhone} error={errors.contactPhone} onChange={e => update("contactPhone", e.target.value)} placeholder="05XXXXXXXX" />
            </FieldShell>
          </div>
          <FieldShell label="البريد الإلكتروني (اختياري)">
            <TextInput type="email" value={f.contactEmail} onChange={e => update("contactEmail", e.target.value)} />
          </FieldShell>
        </div>

        {Object.keys(errors).length > 0 && (
          <p className="text-sm text-[#A64B4B] mb-4">يرجى تعبئة الحقول الإلزامية المطلوبة قبل الإرسال.</p>
        )}
        {submitError && <p className="text-sm text-[#A64B4B] mb-4">{submitError}</p>}
        <PrimaryButton disabled={saving} icon={Send} onClick={handleSubmit} className="w-full sm:w-auto">{saving ? "جارٍ الإرسال..." : "إرسال الطلب بخصوصية"}</PrimaryButton>
      </div>
    </div>
  );
}

/* ============================= List Property Page ============================= */

const emptyListing = { offerType: "sale", propertyType: "", city: "", district: "", area: "", price: "", facades: "", age: "", amenities: [], description: "", contactName: "", contactPhone: "" };

function ListPropertyPage({ onSubmit }) {
  const [f, setF] = useState(emptyListing);
  const [images, setImages] = useState([]);
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const fileRef = useRef(null);
  const required = ["propertyType", "city", "area", "price", "contactName", "contactPhone"];

  function update(k, v) { setF(s => ({ ...s, [k]: v })); }
  function toggleAmenity(a) {
    setF(s => ({ ...s, amenities: s.amenities.includes(a) ? s.amenities.filter(x => x !== a) : [...s.amenities, a] }));
  }
  function handleFiles(e) {
    const files = Array.from(e.target.files || []);
    const next = files.map(file => ({ file, name: file.name, url: URL.createObjectURL(file) }));
    setImages(prev => [...prev, ...next]);
    e.target.value = "";
  }
  function removeImage(i) {
    setImages(prev => {
      const item = prev[i];
      if (item?.url) URL.revokeObjectURL(item.url);
      return prev.filter((_, idx) => idx !== i);
    });
  }

  async function handleSubmit() {
    const errs = {};
    required.forEach(k => { if (!String(f[k]).trim()) errs[k] = true; });
    setErrors(errs);
    setSubmitError("");
    if (Object.keys(errs).length > 0) return;
    setSaving(true);
    try {
      let imageUrls = [];
      if (images.length) {
        const uploaded = await uploadImages(images.map(i => i.file));
        imageUrls = uploaded.images || [];
      }
      await onSubmit({
        ...f,
        area: Number(f.area), price: Number(f.price),
        images: imageUrls,
      });
      images.forEach(i => i.url && URL.revokeObjectURL(i.url));
      setSubmitted(true);
    } catch (error) {
      setSubmitError(error.message || "تعذر إرسال العقار، حاول مرة أخرى.");
    } finally {
      setSaving(false);
    }
  }

  if (submitted) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-24 text-center">
        <span className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#F4ECDD] text-[#8A6C34] mb-6"><Clock size={30} /></span>
        <h2 className="text-2xl font-bold mb-3" style={{ fontFamily: "'Almarai', sans-serif" }}>تم استلام عرضكم</h2>
        <p className="text-[#6B7280] mb-8 leading-relaxed">
          سيقوم فريقنا بمراجعة بيانات العقار خلال وقت قصير، وبعد اعتماد العرض سيظهر تلقائياً في صفحة العقارات المعروضة للزوار.
        </p>
        <GoldButton onClick={() => { setF(emptyListing); setImages([]); setSubmitted(false); }}>عرض عقار آخر</GoldButton>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
      <div className="mb-8">
        <ToneBadge tone="gold" icon={TrendingUp}>سيظهر عرضكم للزوار بعد مراجعة سريعة</ToneBadge>
        <h1 className="text-2xl font-bold mt-4 mb-2" style={{ fontFamily: "'Almarai', sans-serif" }}>عرض عقار للبيع أو الإيجار</h1>
        <p className="text-sm text-[#6B7280]">أدخل بيانات عقاركم بدقة لضمان وصولها لأكبر عدد من المهتمين الجادين.</p>
      </div>

      <div className="bg-white border border-[#E5E7EB] rounded-sm p-6 sm:p-8">
        <FieldShell label="نوع العرض" required>
          <div className="flex gap-3">
            {OFFER_TYPES.map(o => (
              <button key={o.value} onClick={() => update("offerType", o.value)}
                className={`flex-1 py-2.5 rounded-sm text-sm font-semibold border transition ${f.offerType === o.value ? "bg-[#0E1E3B] text-white border-[#0E1E3B]" : "border-[#D6DAE3] text-[#4B5563]"}`}>
                {o.label}
              </button>
            ))}
          </div>
        </FieldShell>

        <div className="grid sm:grid-cols-2 gap-x-6">
          <FieldShell label="نوع العقار" required>
            <Select value={f.propertyType} error={errors.propertyType} onChange={e => update("propertyType", e.target.value)}>
              <option value="">اختر نوع العقار</option>
              {PROPERTY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </Select>
          </FieldShell>
          <FieldShell label="المدينة" required>
            <Select value={f.city} error={errors.city} onChange={e => update("city", e.target.value)}>
              <option value="">اختر المدينة</option>
              {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
            </Select>
          </FieldShell>
        </div>
        <FieldShell label="الموقع الجغرافي الدقيق (الحي / أقرب معلم)">
          <TextInput value={f.district} onChange={e => update("district", e.target.value)} placeholder="مثال: حي الياسمين، بجوار مسجد النور" />
        </FieldShell>
        <div className="grid sm:grid-cols-2 gap-x-6">
          <FieldShell label="المساحة الإجمالية (م²)" required>
            <TextInput type="number" value={f.area} error={errors.area} onChange={e => update("area", e.target.value)} />
          </FieldShell>
          <FieldShell label="السعر (ريال)" required>
            <TextInput type="number" value={f.price} error={errors.price} onChange={e => update("price", e.target.value)} />
          </FieldShell>
          <FieldShell label="عدد الواجهات">
            <Select value={f.facades} onChange={e => update("facades", e.target.value)}>
              <option value="">اختر</option>
              {FACADE_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
            </Select>
          </FieldShell>
          <FieldShell label="عمر العقار">
            <Select value={f.age} onChange={e => update("age", e.target.value)}>
              <option value="">اختر</option>
              {AGE_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
            </Select>
          </FieldShell>
        </div>

        <FieldShell label="تفاصيل المرافق">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {AMENITIES_LIST.map(a => (
              <button type="button" key={a} onClick={() => toggleAmenity(a)}
                className={`text-xs text-right px-3 py-2.5 rounded-sm border flex items-center gap-2 transition ${f.amenities.includes(a) ? "border-[#0E1E3B] bg-[#F4F5F7]" : "border-[#D6DAE3]"}`}>
                <CheckCircle2 size={14} className={f.amenities.includes(a) ? "text-[#0E1E3B]" : "text-[#D1D5DB]"} />
                {a}
              </button>
            ))}
          </div>
        </FieldShell>

        <FieldShell label="وصف إضافي عن العقار">
          <TextArea value={f.description} onChange={e => update("description", e.target.value)} placeholder="تشطيب، إطلالة، مميزات خاصة بالعقار..." />
        </FieldShell>

        <FieldShell label="صور ومخططات العقار">
          <div onClick={() => fileRef.current?.click()} className="border border-dashed border-[#D6DAE3] rounded-sm p-6 text-center cursor-pointer hover:border-[#0E1E3B] transition">
            <ImagePlus size={22} className="mx-auto text-[#9CA3AF] mb-2" />
            <p className="text-sm text-[#6B7280]">اضغط لرفع صور أو مخططات العقار (يمكن اختيار أكثر من ملف)</p>
            <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={handleFiles} />
          </div>
          {images.length > 0 && (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 mt-4">
              {images.map((img, i) => (
                <div key={i} className="relative group">
                  <img src={img.url} alt={img.name} className="w-full h-20 object-cover rounded-sm border border-[#E5E7EB]" />
                  <button onClick={() => removeImage(i)} className="absolute -top-1.5 -left-1.5 bg-[#0E1E3B] text-white rounded-full p-0.5"><X size={12} /></button>
                </div>
              ))}
            </div>
          )}
        </FieldShell>

        <div className="border-t border-[#F0F1F3] pt-6 mt-2">
          <h3 className="text-sm font-bold mb-4">معلومات التواصل</h3>
          <div className="grid sm:grid-cols-2 gap-x-6">
            <FieldShell label="الاسم" required>
              <TextInput value={f.contactName} error={errors.contactName} onChange={e => update("contactName", e.target.value)} />
            </FieldShell>
            <FieldShell label="رقم الجوال" required>
              <TextInput value={f.contactPhone} error={errors.contactPhone} onChange={e => update("contactPhone", e.target.value)} placeholder="05XXXXXXXX" />
            </FieldShell>
          </div>
        </div>

        {Object.keys(errors).length > 0 && (
          <p className="text-sm text-[#A64B4B] mb-4">يرجى تعبئة الحقول الإلزامية المطلوبة قبل الإرسال.</p>
        )}
        <PrimaryButton icon={Send} onClick={handleSubmit} className="w-full sm:w-auto">إرسال العرض للمراجعة</PrimaryButton>
      </div>
    </div>
  );
}

/* ============================= Admin ============================= */

function AdminLogin({ onSuccess }) {
  const [identity, setIdentity] = useState("");
  const [pass, setPass] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function tryLogin() {
    if (!identity.trim() || !pass) { setError("أدخل اسم المستخدم أو البريد وكلمة المرور."); return; }
    setSaving(true);
    setError("");
    try {
      const data = await adminLogin(identity.trim(), pass);
      localStorage.setItem("adminToken", data.token);
      localStorage.setItem("adminUser", JSON.stringify(data.user || {}));
      onSuccess(data);
    } catch (err) {
      setError(err.message || "بيانات الدخول غير صحيحة.");
    } finally { setSaving(false); }
  }

  return (
    <div className="max-w-md mx-auto px-4 py-24">
      <div className="bg-white border border-[#E5E7EB] rounded-sm p-8 text-center">
        <span className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-[#E9ECF3] text-[#0E1E3B] mb-5"><Lock size={24} /></span>
        <h2 className="text-xl font-bold mb-1.5" style={{ fontFamily: "'Almarai', sans-serif" }}>دخول لوحة الإدارة</h2>
        <p className="text-xs text-[#6B7280] mb-6">الدخول يتم التحقق منه على الخادم عبر JWT</p>
        <TextInput placeholder="اسم المستخدم أو البريد الإلكتروني" value={identity} error={!!error}
          onChange={e => { setIdentity(e.target.value); setError(""); }} />
        <TextInput className="mt-3" type="password" placeholder="كلمة المرور" value={pass} error={!!error}
          onChange={e => { setPass(e.target.value); setError(""); }}
          onKeyDown={e => e.key === "Enter" && tryLogin()} />
        {error && <p className="text-xs text-[#A64B4B] mt-2">{error}</p>}
        <PrimaryButton disabled={saving} onClick={tryLogin} className="w-full mt-5">{saving ? "جارٍ التحقق..." : "دخول"}</PrimaryButton>
        <div className="flex items-start gap-2 text-right bg-[#F4F5F7] rounded-sm p-3 mt-6">
          <ShieldAlert size={15} className="text-[#8A6C34] mt-0.5 shrink-0" />
          <p className="text-[11px] text-[#6B7280] leading-relaxed">
            لا توجد كلمة مرور تجريبية داخل الواجهة. أنشئ حساب الإدارة من Backend باستخدام متغيرات البيئة ثم استخدم بياناته هنا.
          </p>
        </div>
      </div>
    </div>
  );
}

function AdminDashboard({ onLogout }) {
  const [tab, setTab] = useState("requests");
  const [statusFilter, setStatusFilter] = useState("all");
  const [requests, setRequests] = useState([]);
  const [pendingListings, setPendingListings] = useState([]);
  const [publishedListings, setPublishedListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadAdminData() {
    setLoading(true); setError("");
    try {
      const [reqs, pending, published] = await Promise.all([
        getAdminRequests(statusFilter),
        getPendingProperties(),
        getProperties({})
      ]);
      setRequests(reqs);
      setPendingListings(pending);
      setPublishedListings(published);
    } catch (err) {
      setError(err.message || "تعذر تحميل بيانات الإدارة.");
      if (/جلسة|token|صلاحية|غير مصرح|401|403/i.test(err.message || "")) onLogout();
    } finally { setLoading(false); }
  }

  useEffect(() => { loadAdminData(); }, [statusFilter]);

  async function updateRequestStatus(id, status) {
    try { await updateAdminRequestStatus(id, status); await loadAdminData(); }
    catch (err) { setError(err.message || "تعذر تحديث الطلب."); }
  }
  async function approveListing(id) {
    try { await approveProperty(id); await loadAdminData(); }
    catch (err) { setError(err.message || "تعذر اعتماد العقار."); }
  }
  async function toggleFeaturedStatus(id, featured) {
    try { await toggleFeatured(id, !featured); await loadAdminData(); }
    catch (err) { setError(err.message || "تعذر تحديث حالة التمييز."); }
  }
  async function deleteListing(id) {
    if (!window.confirm("هل أنت متأكد من حذف هذا العقار؟")) return;
    try { await deleteProperty(id); await loadAdminData(); }
    catch (err) { setError(err.message || "تعذر حذف العقار."); }
  }
  async function exportCSV() {
    try {
      const blob = await getRequestsCsv(statusFilter);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = `طلبات-العقارات-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
    } catch (err) { setError(err.message || "تعذر تصدير البيانات."); }
  }

  const totalListings = pendingListings.length + publishedListings.length;
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <span className="flex items-center justify-center w-11 h-11 rounded-sm bg-[#0E1E3B] text-white"><LayoutDashboard size={19} /></span>
          <div><h1 className="text-xl font-bold" style={{ fontFamily: "'Almarai', sans-serif" }}>لوحة تحكم الإدارة</h1><p className="text-xs text-[#6B7280]">بيانات مباشرة من قاعدة البيانات</p></div>
        </div>
        <GhostButton icon={LogOut} onClick={onLogout}>تسجيل الخروج</GhostButton>
      </div>

      {error && <div className="mb-5 border border-[#E7C3C3] bg-[#F7E9E9] text-[#8F3D3D] p-3 text-sm rounded-sm">{error}</div>}
      <div className="flex gap-2 border-b border-[#E5E7EB] mb-8">
        {[{ id: "requests", label: `طلبات العقارات الخاصة (${requests.length})` }, { id: "listings", label: `العروض المعلنة (${totalListings})` }].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} className={`px-4 py-3 text-sm font-semibold border-b-2 -mb-px transition ${tab === t.id ? "border-[#AD8A52] text-[#0E1E3B]" : "border-transparent text-[#9CA3AF]"}`}>{t.label}</button>
        ))}
      </div>

      {loading ? <div className="bg-white border border-[#E5E7EB] p-12 text-center text-sm text-[#6B7280]">جارٍ تحميل بيانات الإدارة...</div> : tab === "requests" ? (
        <div>
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-2"><span className="text-sm text-[#6B7280]">تصفية حسب الحالة:</span><Select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="!w-auto !py-2"><option value="all">جميع الحالات</option>{REQUEST_STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}</Select></div>
            <GhostButton icon={FileDown} onClick={exportCSV}>تصدير البيانات (CSV)</GhostButton>
          </div>
          <div className="space-y-4">
            {requests.length === 0 && <div className="border border-dashed border-[#D6DAE3] rounded-sm py-16 text-center text-sm text-[#6B7280]">لا توجد طلبات ضمن هذا الفلتر</div>}
            {requests.map(r => { const statusInfo = REQUEST_STATUSES.find(s => s.value === r.status); return (
              <div key={r.id || r._id} className="bg-white border border-[#E5E7EB] rounded-sm p-5">
                <div className="flex flex-wrap items-start justify-between gap-4 mb-4"><div><div className="flex items-center gap-2 mb-1.5"><h4 className="font-bold">{r.propertyType} - {r.city}{r.district ? " / " + r.district : ""}</h4><ToneBadge tone={statusInfo?.tone}>{statusInfo?.label}</ToneBadge></div><p className="text-xs text-[#9CA3AF]">رقم الطلب #{r.id || r._id} - {new Date(r.createdAt).toLocaleDateString("ar-SA")}</p></div><Select value={r.status} onChange={e => updateRequestStatus(r.id || r._id, e.target.value)} className="!w-auto !py-2 text-xs">{REQUEST_STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}</Select></div>
                <div className="grid sm:grid-cols-3 gap-4 text-xs text-[#4B5563] mb-4"><div><span className="text-[#9CA3AF]">المساحة: </span>{r.areaMin || "-"} إلى {r.areaMax || "-"} م²</div><div><span className="text-[#9CA3AF]">الميزانية: </span>{formatSAR(r.budgetMin)} إلى {formatSAR(r.budgetMax)}</div><div><span className="text-[#9CA3AF]">الغرف/الأدوار: </span>{r.rooms || "-"}</div></div>
                {r.notes && <p className="text-xs text-[#6B7280] bg-[#F4F5F7] rounded-sm p-3 mb-4">{r.notes}</p>}
                <div className="flex items-center gap-4 text-xs border-t border-[#F0F1F3] pt-3"><span className="font-medium">{r.contactName}</span><a href={waLink(r.contactPhone, "مرحباً " + r.contactName + "، بخصوص طلبكم العقاري")} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-[#3E7C5A]"><MessageCircle size={13} /> {r.contactPhone}</a></div>
              </div>); })}
          </div>
        </div>
      ) : (
        <div>
          {pendingListings.length > 0 && <div className="mb-8"><h3 className="text-sm font-bold mb-3 flex items-center gap-2 text-[#8A6C34]"><Clock size={15} /> بانتظار المراجعة ({pendingListings.length})</h3><div className="space-y-3">{pendingListings.map(p => <div key={p.id || p._id} className="bg-white border border-[#E2CFA0] rounded-sm p-4 flex flex-wrap items-center gap-4"><img src={p.images?.[0]} className="w-20 h-16 object-cover rounded-sm shrink-0" /><div className="flex-1 min-w-[200px]"><div className="font-bold text-sm">{p.propertyType} - {p.district}, {p.city}</div><div className="text-xs text-[#6B7280]">{formatSAR(p.price)} - {formatArea(p.area)} - {p.contactName}</div></div><GhostButton icon={CheckCircle2} onClick={() => approveListing(p.id || p._id)} className="!border-[#3E7C5A] !text-[#3E7C5A]">اعتماد ونشر</GhostButton><button onClick={() => deleteListing(p.id || p._id)} className="text-[#A64B4B] p-2"><Trash2 size={16} /></button></div>)}</div></div>}
          <h3 className="text-sm font-bold mb-3 flex items-center gap-2"><Eye size={15} /> العروض المنشورة ({publishedListings.length})</h3>
          <div className="overflow-x-auto border border-[#E5E7EB] rounded-sm bg-white"><table className="w-full text-sm"><thead><tr className="bg-[#F4F5F7] text-right text-xs text-[#6B7280]"><th className="p-3.5 font-medium">العقار</th><th className="p-3.5 font-medium">المدينة</th><th className="p-3.5 font-medium">السعر</th><th className="p-3.5 font-medium">مميز</th><th className="p-3.5 font-medium">إجراءات</th></tr></thead><tbody>{publishedListings.map(p => <tr key={p.id || p._id} className="border-t border-[#F0F1F3]"><td className="p-3.5 flex items-center gap-2.5"><img src={p.images?.[0]} className="w-12 h-10 object-cover rounded-sm" /><span className="text-xs font-medium">{p.propertyType} - {p.district}</span></td><td className="p-3.5 text-xs">{p.city}</td><td className="p-3.5 text-xs font-bold">{formatSAR(p.price)}</td><td className="p-3.5"><button onClick={() => toggleFeaturedStatus(p.id || p._id, p.featured)} aria-label="تبديل مميز"><Pin size={16} className={p.featured ? "text-[#AD8A52]" : "text-[#D1D5DB]"} /></button></td><td className="p-3.5"><button onClick={() => deleteListing(p.id || p._id)} className="text-[#A64B4B]"><Trash2 size={15} /></button></td></tr>)}</tbody></table></div>
        </div>
      )}
    </div>
  );
}

/* ============================= Footer ============================= */

function Footer({ setView }) {
  return (
    <footer className="bg-[#0A1730] text-white/70 mt-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 grid sm:grid-cols-3 gap-8">
        <div>
          <div className="flex items-center gap-2.5 mb-4">
            <span className="flex items-center justify-center w-8 h-8 rounded-sm bg-[#AD8A52]"><Building2 size={16} className="text-[#0E1E3B]" /></span>
            <span className="font-bold text-white" style={{ fontFamily: "'Almarai', sans-serif" }}>الديار العقارية</span>
          </div>
          <p className="text-xs leading-relaxed">منصة عقارية متخصصة في إدارة طلبات البيع والشراء والإيجار بخصوصية وكفاءة عالية.</p>
        </div>
        <div>
          <h5 className="text-white font-bold text-sm mb-4">روابط سريعة</h5>
          <div className="flex flex-col gap-2 text-xs">
            <button onClick={() => setView("properties")} className="text-right hover:text-white w-fit">العقارات المعروضة</button>
            <button onClick={() => setView("request")} className="text-right hover:text-white w-fit">اطلب عقاراً</button>
            <button onClick={() => setView("list")} className="text-right hover:text-white w-fit">اعرض عقارك</button>
            <button onClick={() => setView("calculator")} className="text-right hover:text-white w-fit">حاسبة التمويل</button>
          </div>
        </div>
        <div>
          <h5 className="text-white font-bold text-sm mb-4">تواصل معنا</h5>
          <div className="flex flex-col gap-2 text-xs">
            <span className="flex items-center gap-2"><Phone size={13} /> 966500000000+</span>
            <a href={waLink(WHATSAPP_NUMBER, "مرحباً، أرغب في الاستفسار")} target="_blank" rel="noreferrer" className="flex items-center gap-2 hover:text-white"><MessageCircle size={13} /> تواصل عبر واتساب</a>
          </div>
        </div>
      </div>
      <div className="border-t border-white/10 text-center text-[11px] py-4">جميع الحقوق محفوظة © الديار العقارية 2026</div>
    </footer>
  );
}

/* ============================= App root ============================= */

export default function RealEstatePlatform() {
  const [view, setView] = useState("home");
  const [properties, setProperties] = useState([]);
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [adminAuthed, setAdminAuthed] = useState(() => Boolean(localStorage.getItem("adminToken")));
  const [loadingProperties, setLoadingProperties] = useState(true);
  const [propertyError, setPropertyError] = useState("");

  async function loadProperties() {
    setLoadingProperties(true); setPropertyError("");
    try { setProperties(await getProperties({})); }
    catch (error) { setPropertyError(error.message || "تعذر تحميل العقارات من الخادم."); }
    finally { setLoadingProperties(false); }
  }

  useEffect(() => { loadProperties(); }, []);

  async function handleNewRequest(data) { await createRequest(data); }
  async function handleNewListing(data) { await createProperty(data); await loadProperties(); }
  async function openProperty(idOrProperty) {
    const id = typeof idOrProperty === "object" ? (idOrProperty.id || idOrProperty._id) : idOrProperty;
    try { setSelectedProperty(await getProperty(id)); }
    catch { setSelectedProperty(typeof idOrProperty === "object" ? idOrProperty : null); }
  }
  function logoutAdmin() { localStorage.removeItem("adminToken"); localStorage.removeItem("adminUser"); setAdminAuthed(false); setView("home"); }

  return (
    <div dir="rtl" lang="ar" className="min-h-screen bg-[#F4F5F7] text-[#1A2233]" style={{ fontFamily: "'Cairo', sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Almarai:wght@400;700;800&family=Cairo:wght@300;400;500;600;700&display=swap'); * { font-family: 'Cairo', sans-serif; } ::selection { background: #AD8A52; color: white; }`}</style>
      <NavBar view={view} setView={setView} />
      {propertyError && <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-5"><div className="border border-[#E7C3C3] bg-[#F7E9E9] text-[#8F3D3D] p-3 text-sm rounded-sm">{propertyError}</div></div>}
      {view === "home" && <HomePage properties={properties} setView={setView} openProperty={setSelectedProperty} />}
      {view === "properties" && <PropertiesPage properties={properties} openProperty={setSelectedProperty} loading={loadingProperties} />}
      {view === "request" && <RequestPropertyPage onSubmit={handleNewRequest} />}
      {view === "list" && <ListPropertyPage onSubmit={handleNewListing} />}
      {view === "calculator" && <div className="max-w-3xl mx-auto px-4 sm:px-6 py-14"><h1 className="text-2xl font-bold mb-6" style={{ fontFamily: "'Almarai', sans-serif" }}>حاسبة التمويل العقاري</h1><MortgageCalculator standalone /></div>}
      {view === "admin" && (adminAuthed ? <AdminDashboard onLogout={logoutAdmin} /> : <AdminLogin onSuccess={() => { setAdminAuthed(true); }} />)}
      {selectedProperty && <PropertyModal p={selectedProperty} onClose={() => setSelectedProperty(null)} />}
      <a href={waLink(WHATSAPP_NUMBER, "مرحباً، أرغب في الاستفسار عن خدماتكم العقارية.")} target="_blank" rel="noreferrer" className="fixed bottom-6 left-6 z-40 flex items-center justify-center w-14 h-14 rounded-full bg-[#3E7C5A] text-white shadow-lg hover:bg-[#336749] transition"><MessageCircle size={24} /></a>
      <Footer setView={setView} />
    </div>
  );
}
