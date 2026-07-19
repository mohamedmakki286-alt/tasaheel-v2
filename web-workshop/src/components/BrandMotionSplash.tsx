import './BrandRoadSplash.css';

export default function BrandMotionSplash() {
  return (
    <div className="brand-splash brand-splash--road" role="status" aria-label="جاري تحميل تساهيل">
      <div className="brand-splash__scene">
        <img className="brand-splash__reference-car" src="/splash-car-reference.jpeg" alt="" />
        <div className="brand-splash__road-motion" aria-hidden="true" />
      </div>
      <p className="brand-splash__road-tagline">نجهّز ورشتك ليوم عمل أسهل</p>
    </div>
  );
}
