export interface CarBrand {
  key: string;
  nameAr: string;
  aliases: string[];
}

export const BRANDS: CarBrand[] = [
  { key: 'toyota', nameAr: 'تويوتا', aliases: ['toyota', 'تويوتا'] },
  { key: 'nissan', nameAr: 'نيسان', aliases: ['nissan', 'نيسان'] },
  { key: 'honda', nameAr: 'هوندا', aliases: ['honda', 'هوندا'] },
  { key: 'hyundai', nameAr: 'هيونداي', aliases: ['hyundai', 'هيونداي', 'هونداي'] },
  { key: 'kia', nameAr: 'كيا', aliases: ['kia', 'كيا'] },
  { key: 'ford', nameAr: 'فورد', aliases: ['ford', 'فورد'] },
  { key: 'chevrolet', nameAr: 'شيفروليه', aliases: ['chevrolet', 'chevy', 'شفروليه', 'شيفروليه'] },
  { key: 'bmw', nameAr: 'بي ام دبليو', aliases: ['bmw', 'بي ام دبليو', 'بي إم دبليو'] },
  { key: 'audi', nameAr: 'أودي', aliases: ['audi', 'اودي', 'أودي'] },
  { key: 'volkswagen', nameAr: 'فولكس فاجن', aliases: ['volkswagen', 'vw', 'فولكس واجن', 'فولكس فاجن'] },
  { key: 'volvo', nameAr: 'فولفو', aliases: ['volvo', 'فولفو'] },
  { key: 'mazda', nameAr: 'مازدا', aliases: ['mazda', 'مازدا'] },
  { key: 'mitsubishi', nameAr: 'ميتسوبيشي', aliases: ['mitsubishi', 'ميتسوبيشي'] },
  { key: 'subaru', nameAr: 'سوبارو', aliases: ['subaru', 'سوبارو'] },
  { key: 'suzuki', nameAr: 'سوزوكي', aliases: ['suzuki', 'سوزوكي'] },
  { key: 'tesla', nameAr: 'تسلا', aliases: ['tesla', 'تسلا'] },
  { key: 'jeep', nameAr: 'جيب', aliases: ['jeep', 'جيب'] },
  { key: 'porsche', nameAr: 'بورشه', aliases: ['porsche', 'بورش', 'بورشه'] },
  { key: 'ferrari', nameAr: 'فيراري', aliases: ['ferrari', 'فيراري'] },
  { key: 'lamborghini', nameAr: 'لامبورغيني', aliases: ['lamborghini', 'لامبورغيني'] },
  { key: 'bentley', nameAr: 'بنتلي', aliases: ['bentley', 'بنتلي'] },
  { key: 'cadillac', nameAr: 'كاديلاك', aliases: ['cadillac', 'كاديلاك'] },
  { key: 'chrysler', nameAr: 'كرايسلر', aliases: ['chrysler', 'كرايسلر'] },
  { key: 'fiat', nameAr: 'فيات', aliases: ['fiat', 'فيات'] },
  { key: 'peugeot', nameAr: 'بيجو', aliases: ['peugeot', 'بيجو'] },
  { key: 'renault', nameAr: 'رينو', aliases: ['renault', 'رينو'] },
  { key: 'citroen', nameAr: 'سيتروين', aliases: ['citroen', 'سيتروين'] },
  { key: 'skoda', nameAr: 'سكودا', aliases: ['skoda', 'سكودا'] },
  { key: 'seat', nameAr: 'سيات', aliases: ['seat', 'سيات'] },
  { key: 'infiniti', nameAr: 'إنفينيتي', aliases: ['infiniti', 'انفينيتي', 'إنفينيتي'] },
  { key: 'acura', nameAr: 'أكورا', aliases: ['acura', 'اكورا', 'أكورا'] },
  { key: 'mini', nameAr: 'ميني', aliases: ['mini', 'ميني'] },
  { key: 'maserati', nameAr: 'مازيراتي', aliases: ['maserati', 'مازيراتي'] },
  { key: 'bugatti', nameAr: 'بوغاتي', aliases: ['bugatti', 'بوغاتي'] },
  { key: 'rollsroyce', nameAr: 'رولز رويس', aliases: ['rolls royce', 'rolls-royce', 'رولز رويس'] },
  { key: 'mg', nameAr: 'إم جي', aliases: ['mg', 'ام جي', 'إم جي'] },
];

const normalize = (value: string) => value.toLowerCase().trim().replace(/[أإآ]/g, 'ا').replace(/[-_]/g, ' ').replace(/\s+/g, ' ');

export function getCarBrandLogo(make?: string) {
  if (!make) return null;
  const normalized = normalize(make);
  const entry = BRANDS.find((b) => b.aliases.some((name) => normalize(name) === normalized));
  return entry ? `/car-brands/${entry.key}.svg` : null;
}
