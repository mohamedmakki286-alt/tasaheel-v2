const aliases: Record<string, string[]> = {
  toyota: ['toyota', 'تويوتا'], nissan: ['nissan', 'نيسان'], honda: ['honda', 'هوندا'],
  hyundai: ['hyundai', 'هيونداي', 'هونداي'], kia: ['kia', 'كيا'], ford: ['ford', 'فورد'],
  chevrolet: ['chevrolet', 'chevy', 'شفروليه', 'شيفروليه'], bmw: ['bmw', 'بي ام دبليو', 'بي إم دبليو'],
  audi: ['audi', 'اودي', 'أودي'], volkswagen: ['volkswagen', 'vw', 'فولكس واجن', 'فولكس فاجن'],
  volvo: ['volvo', 'فولفو'], mazda: ['mazda', 'مازدا'], mitsubishi: ['mitsubishi', 'ميتسوبيشي'],
  subaru: ['subaru', 'سوبارو'], suzuki: ['suzuki', 'سوزوكي'], tesla: ['tesla', 'تسلا'],
  jeep: ['jeep', 'جيب'], porsche: ['porsche', 'بورش', 'بورشه'], ferrari: ['ferrari', 'فيراري'],
  lamborghini: ['lamborghini', 'لامبورغيني'], bentley: ['bentley', 'بنتلي'], cadillac: ['cadillac', 'كاديلاك'],
  chrysler: ['chrysler', 'كرايسلر'], fiat: ['fiat', 'فيات'], peugeot: ['peugeot', 'بيجو'],
  renault: ['renault', 'رينو'], citroen: ['citroen', 'سيتروين'], skoda: ['skoda', 'سكودا'],
  seat: ['seat', 'سيات'], infiniti: ['infiniti', 'انفينيتي', 'إنفينيتي'], acura: ['acura', 'اكورا', 'أكورا'],
  mini: ['mini', 'ميني'], maserati: ['maserati', 'مازيراتي'], bugatti: ['bugatti', 'بوغاتي'],
  rollsroyce: ['rolls royce', 'rolls-royce', 'رولز رويس'], mg: ['mg', 'ام جي', 'إم جي'],
};

const normalize = (value: string) => value.toLowerCase().trim().replace(/[أإآ]/g, 'ا').replace(/[-_]/g, ' ').replace(/\s+/g, ' ');

export function getCarBrandLogo(make?: string) {
  if (!make) return null;
  const normalized = normalize(make);
  const entry = Object.entries(aliases).find(([, names]) => names.some((name) => normalize(name) === normalized));
  return entry ? `/car-brands/${entry[0]}.svg` : null;
}
