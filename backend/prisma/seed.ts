import { PrismaClient, UserRole, SubscriptionStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // ============================================================
  // 1. SUPER ADMIN
  // ============================================================
  const superAdminEmail = process.env.SUPER_ADMIN_EMAIL || 'superadmin@omnivia.io';
  const superAdminPassword = process.env.SUPER_ADMIN_PASSWORD || 'OmniviaAdmin2024!';
  const superAdminName = process.env.SUPER_ADMIN_NAME || 'Super Admin Omnivia';

  const [firstName, ...lastNameParts] = superAdminName.split(' ');
  const lastName = lastNameParts.join(' ') || 'Admin';

  const existingSuperAdmin = await prisma.user.findUnique({ where: { email: superAdminEmail } });

  if (!existingSuperAdmin) {
    const passwordHash = await bcrypt.hash(superAdminPassword, 12);
    await prisma.user.create({
      data: {
        email: superAdminEmail,
        passwordHash,
        firstName,
        lastName,
        role: UserRole.SUPER_ADMIN_OMNIVIA,
        isActive: true,
        emailVerified: true,
      },
    });
    console.log(`✅ Super Admin creato: ${superAdminEmail}`);
  } else {
    console.log(`ℹ️  Super Admin già esistente: ${superAdminEmail}`);
  }

  // ============================================================
  // 2. PIANI
  // ============================================================
  const plans = [
    {
      name: 'Starter',
      description: 'Piano ideale per piccole imprese e professionisti. Include tutte le funzionalità base.',
      priceMonthly: 29.00,
      priceYearly: 290.00,
      durationDays: 30,
      maxUsers: 3,
      maxClients: 100,
      maxDocuments: 500,
      features: {
        clienti: true,
        fornitori: true,
        prodotti: true,
        servizi: true,
        attivita: true,
        calendario: true,
        preventivi: true,
        fatture: true,
        pagamenti: true,
        documenti: true,
        notifiche: true,
        report_base: true,
      },
      isActive: true,
    },
    {
      name: 'Professional',
      description: 'Piano completo per aziende in crescita. Utenti illimitati e funzionalità avanzate.',
      priceMonthly: 59.00,
      priceYearly: 590.00,
      durationDays: 30,
      maxUsers: 10,
      maxClients: 500,
      maxDocuments: 2000,
      features: {
        clienti: true,
        fornitori: true,
        prodotti: true,
        servizi: true,
        attivita: true,
        calendario: true,
        preventivi: true,
        fatture: true,
        pagamenti: true,
        documenti: true,
        notifiche: true,
        report_base: true,
        report_avanzati: true,
        audit_log: true,
        multi_utente: true,
      },
      isActive: true,
    },
    {
      name: 'Enterprise',
      description: 'Piano illimitato per grandi aziende. Supporto prioritario e funzionalità personalizzate.',
      priceMonthly: 99.00,
      priceYearly: 990.00,
      durationDays: 30,
      maxUsers: null,
      maxClients: null,
      maxDocuments: null,
      features: {
        clienti: true,
        fornitori: true,
        prodotti: true,
        servizi: true,
        attivita: true,
        calendario: true,
        preventivi: true,
        fatture: true,
        pagamenti: true,
        documenti: true,
        notifiche: true,
        report_base: true,
        report_avanzati: true,
        audit_log: true,
        multi_utente: true,
        api_access: true,
        supporto_prioritario: true,
        personalizzazione: true,
      },
      isActive: true,
    },
  ];

  for (const plan of plans) {
    const existing = await prisma.plan.findUnique({ where: { name: plan.name } });
    if (!existing) {
      await prisma.plan.create({ data: plan });
      console.log(`✅ Piano creato: ${plan.name} (€${plan.priceMonthly}/mese)`);
    } else {
      console.log(`ℹ️  Piano già esistente: ${plan.name}`);
    }
  }

  console.log('\n🎉 Seed completato!');
  console.log(`\n📋 Credenziali Super Admin:`);
  console.log(`   Email: ${superAdminEmail}`);
  console.log(`   Password: ${superAdminPassword}`);
  console.log(`\n⚠️  CAMBIA LA PASSWORD IN PRODUZIONE!`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('❌ Errore durante il seed:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
