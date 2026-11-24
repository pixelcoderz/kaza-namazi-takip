import { PrayerKey } from '../types/kaza';

export interface AyetOrHadis {
  id: string;
  kind: 'ayet' | 'hadis';
  text: string;
  source: string;
}

export const AYET_AND_HADIS_LIST: AyetOrHadis[] = [
  {
    id: 'nisa-103',
    kind: 'ayet',
    text: 'Şüphesiz namaz, müminler üzerine vakitleri belirlenmiş bir farzdır.',
    source: 'Kur’an-ı Kerim — Nisâ Suresi, 4/103'
  },
  {
    id: 'bakara-238',
    kind: 'ayet',
    text: 'Namazları ve orta namazı aksatmadan kılın, huşû içinde Allah’ın huzurunda durun.',
    source: 'Kur’an-ı Kerim — Bakara Suresi, 2/238'
  },
  {
    id: 'bakara-153',
    kind: 'ayet',
    text: 'Ey iman edenler! Sabır ve namaz ile Allah’tan yardım isteyin. Şüphesiz Allah sabredenlerle beraberdir.',
    source: 'Kur’an-ı Kerim — Bakara Suresi, 2/153'
  },
  {
    id: 'ankebut-45',
    kind: 'ayet',
    text: 'Sana vahyedilen kitabı oku ve namazı dosdoğru kıl. Muhakkak ki namaz, hayâsızlıktan ve kötülükten alıkoyar.',
    source: 'Kur’an-ı Kerim — Ankebût Suresi, 29/45'
  },
  {
    id: 'taha-14',
    kind: 'ayet',
    text: 'Şüphesiz ben Allah’ım, benden başka ilah yoktur. Bana kulluk et ve beni anmak için namazı dosdoğru kıl.',
    source: 'Kur’an-ı Kerim — Tâhâ Suresi, 20/14'
  },
  {
    id: 'ibrahim-31',
    kind: 'ayet',
    text: 'İman eden kullarıma söyle: Alışverişin ve dostluğun olmadığı bir gün gelmeden önce namazı dosdoğru kılsınlar.',
    source: 'Kur’an-ı Kerim — İbrâhîm Suresi, 14/31'
  },
  {
    id: 'buhari-mevakit-37',
    kind: 'hadis',
    text: 'Kim bir namazı unutursa veya uyuyup kalırsa, hatırladığında onu kılsın. Onun kefareti ancak budur.',
    source: 'Buhârî, Mevâkîtü’s-salât, 37; Müslim, Mesâcid, 315'
  },
  {
    id: 'muslim-mesacid-311',
    kind: 'hadis',
    text: 'Uykuda namazı kaçırmakta bir kusur yoktur. Kusur, ancak bir namazı diğerinin vakti girinceye kadar kılmamaktır. Her kim unutur veya uyuyakalırsa, hatırladığı veya uyandığı zaman hemen kılsın.',
    source: 'Müslim, Mesâcid, 311'
  },
  {
    id: 'buhari-hendek',
    kind: 'hadis',
    text: 'Hz. Peygamber (s.a.s.), Hendek Savaşı günü yoğun çarpışma nedeniyle ikindi namazını vaktinde kılamamış, akşam namazından önce kamet getirtip ikindi namazını kaza etmiştir.',
    source: 'Buhârî, Mevâkîtü’s-salât, 36, 38; Müslim, Mesâcid, 205'
  },
  {
    id: 'muslim-taharet-1',
    kind: 'hadis',
    text: 'Temizlik imanın yarısıdır. Namaz ise nurdur.',
    source: 'Müslim, Tahâret, 1'
  }
];

export interface PrayerIntention {
  key: PrayerKey;
  title: string;
  rekatInfo: string;
  intentionFirst: string;
  intentionLast: string;
  note: string;
}

export const PRAYER_INTENTIONS: PrayerIntention[] = [
  {
    key: 'sabah',
    title: 'Sabah Namazı Kazası',
    rekatInfo: '2 Rekat Farz',
    intentionFirst:
      '“Niyet ettim Allah rızası için, vaktinde kılamadığım İLK sabah namazının farzını kaza etmeye.”',
    intentionLast:
      '“Niyet ettim Allah rızası için, vaktinde kılamadığım SON sabah namazının farzını kaza etmeye.”',
    note: 'Sadece aynı gün öğle vaktinden önce kaza ediliyorsa sünnetiyle birlikte kılınır; geçmiş günlerin sadece 2 rekat farzı kaza edilir.'
  },
  {
    key: 'ogle',
    title: 'Öğle Namazı Kazası',
    rekatInfo: '4 Rekat Farz',
    intentionFirst:
      '“Niyet ettim Allah rızası için, vaktinde kılamadığım İLK öğle namazının farzını kaza etmeye.”',
    intentionLast:
      '“Niyet ettim Allah rızası için, vaktinde kılamadığım SON öğle namazının farzını kaza etmeye.”',
    note: 'Sadece 4 rekat farzı kılınır. İlk iki rekatta Fatiha ve zamm-ı sure, son iki rekatta sadece Fatiha okunur.'
  },
  {
    key: 'ikindi',
    title: 'İkindi Namazı Kazası',
    rekatInfo: '4 Rekat Farz',
    intentionFirst:
      '“Niyet ettim Allah rızası için, vaktinde kılamadığım İLK ikindi namazının farzını kaza etmeye.”',
    intentionLast:
      '“Niyet ettim Allah rızası için, vaktinde kılamadığım SON ikindi namazının farzını kaza etmeye.”',
    note: 'Sadece 4 rekat farzı kılınır. Akşam kerahet vaktine (güneş batımına son 45 dakika) girmeden kılınmalıdır.'
  },
  {
    key: 'aksam',
    title: 'Akşam Namazı Kazası',
    rekatInfo: '3 Rekat Farz',
    intentionFirst:
      '“Niyet ettim Allah rızası için, vaktinde kılamadığım İLK akşam namazının farzını kaza etmeye.”',
    intentionLast:
      '“Niyet ettim Allah rızası için, vaktinde kılamadığım SON akşam namazının farzını kaza etmeye.”',
    note: '3 rekat farz olarak kılınır. İlk iki rekatta Fatiha ve zamm-ı sure, üçüncü rekatta sadece Fatiha okunur.'
  },
  {
    key: 'yatsi',
    title: 'Yatsı Namazı Kazası',
    rekatInfo: '4 Rekat Farz',
    intentionFirst:
      '“Niyet ettim Allah rızası için, vaktinde kılamadığım İLK yatsı namazının farzını kaza etmeye.”',
    intentionLast:
      '“Niyet ettim Allah rızası için, vaktinde kılamadığım SON yatsı namazının farzını kaza etmeye.”',
    note: '4 rekat farzı kılınır. Hanefî mezhebinde yatsının ardından 3 rekatlık Vitir namazı da ayrıca kaza edilir.'
  },
  {
    key: 'vitir',
    title: 'Vitir Namazı Kazası',
    rekatInfo: '3 Rekat Vacip (Hanefî)',
    intentionFirst:
      '“Niyet ettim Allah rızası için, vaktinde kılamadığım İLK vitir namazını kaza etmeye.”',
    intentionLast:
      '“Niyet ettim Allah rızası için, vaktinde kılamadığım SON vitir namazını kaza etmeye.”',
    note: 'Hanefî mezhebine göre vacip olduğu için kaza edilmesi gerekir; 3. rekatta Kunut duaları okunur. Şâfiî mezhebinde sünnet olduğu için kazası gerekmez.'
  }
];

export interface KerahetTime {
  title: string;
  window: string;
  detail: string;
}

export const KERAHET_TIMES: KerahetTime[] = [
  {
    title: '1. Güneş Doğarken',
    window: 'Güneşin doğuşundan sonraki ilk 45–50 dakika',
    detail:
      'Güneş doğup bir mızrak boyu yükselinceye kadar (yaklaşık 45 dakika) kaza dahil hiçbir namaz kılınmaz.'
  },
  {
    title: '2. Öğleden Hemen Önce (Zeval)',
    window: 'Öğle ezanına 10–15 dakika kala',
    detail:
      'Güneşin tam tepe noktasında olduğu bu kısa sürede namaz kılmak tahrimen mekruhtur; öğle vakti girince kılınabilir.'
  },
  {
    title: '3. Güneş Batarken',
    window: 'Akşam ezanına son 45 dakika kala',
    detail:
      'Güneşin sararıp gözü almadığı bu vakitte hiçbir kaza namazı kılınmaz. Yalnızca o günün ikindi farzı yetişmemişse kılınabilir.'
  }
];

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
}

export const DIYANET_FAQ: FaqItem[] = [
  {
    id: 'what-is-kaza',
    question: 'Kaza namazı nedir ve neden kılınır?',
    answer:
      'Vaktinde kılınamayan farz veya vacip namazların, vakti çıktıktan sonra yerine getirilmesine kaza denir. İslam fıkhı ve ilmihal kaynaklarına göre unutma veya uyuyakalma gibi mazeretlerle kaçırılan namazların kaza edilmesi farz olduğu gibi, mazeretsiz terk edilen namazların da tövbe ile birlikte kaza edilmesi gerekir.'
  },
  {
    id: 'which-prayers',
    question: 'Hangi namazlar kaza edilir? Vitir namazı kaza edilir mi?',
    answer:
      'Günün beş vakit farz namazı (Sabah 2, Öğle 4, İkindi 4, Akşam 3, Yatsı 4 rekat) kaza edilir. Hanefî mezhebine göre Vitir namazı vacip olduğundan 3 rekat olarak kaza edilir. Şâfiî, Mâlikî ve Hanbelî mezheplerinde Vitir sünnet kabul edildiği için kazası gerekmez. Geçmiş günlerin sünnetleri kaza edilmez (yalnızca aynı günün sabah namazı öğleye kadar sünnetiyle kaza edilebilir).'
  },
  {
    id: 'puberty-age',
    question: 'Ergenlik yaşı (büluğ çağı) nasıl belirlenir?',
    answer:
      'İslam hukukunda biyolojik ergenlik alametleri görüldüğü anda ibadet yükümlülüğü başlar. Eğer daha erken bir alamet görülmemişse, Hanefî mezhebine göre fetvaya esas görüş kamerî takvimle 15 yaşın başlangıcıdır. Hesaplamada kişinin kendi hatırladığı tarih veya ortalama 15 yaş esas alınır.'
  },
  {
    id: 'intention-rule',
    question: 'Çok fazla kaza borcu olan biri nasıl niyet etmelidir?',
    answer:
      'Her vakit için tarih saymaya gerek yoktur. “Üzerimde borç olan İLK öğle namazını kaza etmeye” veya “SON öğle namazını kaza etmeye” şeklinde niyet edilmesi yeterlidir. Bu yöntem sıradaki borçların düzenli düşmesini sağlar.'
  },
  {
    id: 'ezan-kamet',
    question: 'Kaza namazında ezan ve kamet okunur mu?',
    answer:
      'Erkeklerin farz kaza namazlarını kılarken önce kamet getirmeleri sünnettir. Arka arkaya birden fazla kaza namazı kılınacaksa, ilk namaz için ezan ve kamet okunup diğerlerinin her biri için sadece kamet getirilmesi yeterlidir. Vitir namazı vacip olduğu için kamet getirilmez.'
  },
  {
    id: 'women-excused',
    question: 'Kadınların özel hallerindeki namazlar kaza edilir mi?',
    answer:
      'Hayır. Kadınlar âdet (hayız) ve lohusalık (nifas) günlerinde namazdan muaftır; bu günlerde kılınmayan namazlar sonradan kaza edilmez. Ancak bu günlerde tutulamayan Ramazan oruçları sonradan gününe gün kaza edilir.'
  }
];
