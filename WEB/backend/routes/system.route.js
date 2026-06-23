import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const router = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function getBackendVersion() {
  try {
    const pkgPath = path.join(__dirname, '..', 'package.json');
    const pkgContent = fs.readFileSync(pkgPath, 'utf8');
    const pkg = JSON.parse(pkgContent);
    return pkg.version || '1.0.0';
  } catch (error) {
    return '1.0.0';
  }
}

const WHATS_NEW_FEATURES = [
  {
    version: '1.0.0',
    target: 'user',
    titleEn: 'Welcome to ILMA v1.0.0!',
    titleAr: 'مرحباً بكم في إيلما إصدار 1.0.0!',
    descriptionEn: "We're excited to introduce the first official release of ILMA, featuring state-of-the-art AI personalized learning roadmaps, interactive visual mapping, and progress tracking.",
    descriptionAr: 'يسعدنا تقديم الإصدار الرسمي الأول من إيلما، والذي يتميز بخرائط طريق تعليمية مخصصة بالذكاء الاصطناعي، ورسم خرائط مرئية تفاعلية، ومتابعة التقدم.',
    features: [
      {
        id: 'ai-roadmap',
        titleEn: 'AI Roadmap Builder',
        titleAr: 'مُنشئ خرائط الطريق بالذكاء الاصطناعي',
        descEn: 'Generate tailored software engineering roadmaps based on your level, duration, and study hours with one click.',
        descAr: 'أنشئ خرائط طريق مخصصة لهندسة البرمجيات بناءً على مستواك، مدتك، وساعات دراستك بنقرة واحدة.',
        iconName: 'Route03Icon',
        badgeEn: 'Core',
        badgeAr: 'رئيسي'
      },
      {
        id: 'ai-chat',
        titleEn: 'AI Chat Assistant',
        titleAr: 'مساعد المحادثة بالذكاء الاصطناعي',
        descEn: 'Ask questions, clarify concepts, and get instant guidance on software engineering topics localized in Arabic and English.',
        descAr: 'اطرح الأسئلة، ووضح المفاهيم، واحصل على إرشادات فورية حول مواضيع هندسة البرمجيات باللغتين العربية والإنجليزية.',
        iconName: 'ChatBotIcon',
        badgeEn: 'New',
        badgeAr: 'جديد'
      },
      {
        id: 'learning-constellation',
        titleEn: 'Learning Constellation',
        titleAr: 'كوكبة التعلم التفاعلية',
        descEn: 'Visualize your courses, roadmaps, and next steps in a beautiful 2D/3D dynamic interactive constellation chart.',
        descAr: 'شاهد مساراتك التعليمية ومراحل تقدمك وتوصياتك في رسم بياني كوكبي تفاعلي وحيوي.',
        iconName: 'DashboardSquare03Icon',
        badgeEn: 'Visual',
        badgeAr: 'مرئي'
      },
      {
        id: 'login-streaks',
        titleEn: 'Visit Streaks & Progress',
        titleAr: 'سلاسل الزيارات ومتابعة التقدم',
        descEn: 'Track your daily learning consistency with login streaks, step-by-step completion checks, and course progress.',
        descAr: 'تابع استمرارية تعلمك اليومي مع سلاسل تسجيل الدخول، والتحقق من إكمال الخطوات خطوة بخطوة، وتقدم المساق.',
        iconName: 'UserEdit01Icon',
        badgeEn: 'Fun',
        badgeAr: 'تفاعلي'
      },      {
        id: 'login-streaks',
        titleEn: 'Visit Streaks & Progress',
        titleAr: 'سلاسل الزيارات ومتابعة التقدم',
        descEn: 'Track your daily learning consistency with login streaks, step-by-step completion checks, and course progress.',
        descAr: 'تابع استمرارية تعلمك اليومي مع سلاسل تسجيل الدخول، والتحقق من إكمال الخطوات خطوة بخطوة، وتقدم المساق.',
        iconName: 'UserEdit01Icon',
        badgeEn: 'Fun',
        badgeAr: 'تفاعلي'
      },      {
        id: 'login-streaks',
        titleEn: 'Visit Streaks & Progress',
        titleAr: 'سلاسل الزيارات ومتابعة التقدم',
        descEn: 'Track your daily learning consistency with login streaks, step-by-step completion checks, and course progress.',
        descAr: 'تابع استمرارية تعلمك اليومي مع سلاسل تسجيل الدخول، والتحقق من إكمال الخطوات خطوة بخطوة، وتقدم المساق.',
        iconName: 'UserEdit01Icon',
        badgeEn: 'Fun',
        badgeAr: 'تفاعلي'
      }
    ]
  },
  {
    version: '1.0.0',
    target: 'admin',
    titleEn: 'Admin Command Center v1.0.0',
    titleAr: 'لوحة التحكم للمشرفين إصدار 1.0.0',
    descriptionEn: 'Version 1.0.0 brings a complete administration suite for ILMA, providing oversight for users, roadmaps, courses, and platform activity.',
    descriptionAr: 'يقدم الإصدار 1.0.0 مجموعة إدارية كاملة لمنصة إيلما، مما يوفر إشرافاً دقيقاً للمستخدمين، خرائط الطريق، المساقات، ونشاط المنصة.',
    features: [
      {
        id: 'admin-metrics',
        titleEn: 'Real-time System Overview',
        titleAr: 'نظرة عامة على النظام في الوقت الفعلي',
        descEn: 'Monitor online and active users, total courses, template roadmaps, and unread inquiries at a glance.',
        descAr: 'راقب المستخدمين النشطين والمتصلين بالإنترنت، إجمالي المساقات، قوالب خرائط الطريق، والاستفسارات غير المقروءة بلمحة واحدة.',
        iconName: 'DashboardSquare03Icon',
        badgeEn: 'Live',
        badgeAr: 'مباشر'
      },
      {
        id: 'admin-roadmaps',
        titleEn: 'Template & Course CMS',
        titleAr: 'إدارة القوالب والمساقات',
        descEn: 'Manage platform-wide roadmap templates and courses, coordinate steps, publish updates, and link recommended resources.',
        descAr: 'أدر قوالب خرائط الطريق والمساقات على مستوى المنصة، ونسق الخطوات، وانشر التحديثات، واربط الموارد الموصى بها.',
        iconName: 'Route03Icon',
        badgeEn: 'Control',
        badgeAr: 'تحكم'
      },
      {
        id: 'admin-users',
        titleEn: 'User Controls & Auditing',
        titleAr: 'عناصر التحكم في المستخدمين والملفات الشخصية',
        descEn: 'Oversee user accounts, check verification status, activate/deactivate users, and audit roles.',
        descAr: 'أشرف على حسابات المستخدمين، وتحقق من حالة التفعيل، وقم بتنشيط/إلغاء تنشيط الحسابات، وتدقيق الأدوار.',
        iconName: 'UserEdit01Icon',
        badgeEn: 'Security',
        badgeAr: 'أمان'
      },
      {
        id: 'admin-messages',
        titleEn: 'Contact Inquiry Manager',
        titleAr: 'مدير رسائل واستفسارات الاتصال',
        descEn: 'Read, organize, and reply to messages sent by visitors and users directly from the administration panel.',
        descAr: 'اقرأ رسائل الزوار والمستخدمين ونظمها ورد عليها مباشرة من لوحة التحكم الإدارية.',
        iconName: 'Mail01Icon',
        badgeEn: 'Inbox',
        badgeAr: 'الوارد'
      }
    ]
  }
];

router.get('/whats-new', (req, res) => {
  const version = getBackendVersion();
  res.json({
    version,
    whatsNew: WHATS_NEW_FEATURES
  });
});

export default router;
