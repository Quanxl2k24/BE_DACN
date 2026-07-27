import { PrismaClient } from '../generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import * as crypto from 'crypto';

const pool = new pg.Pool({
  connectionString: process.env['DATABASE_URL'],
});

const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Bắt đầu quá trình Seed Database (Full Quyền & Liên kết)...');

  // ==========================================
  // 1. SEED SYSTEM ROLES (Vai trò hệ thống)
  // ==========================================
  const systemRoles = [
    { name: 'Admin' },
    { name: 'Owner' },
    { name: 'Seeker' },
    { name: 'Hiring Manager' },
  ];

  const roleMap = new Map<string, string>();

  for (const roleData of systemRoles) {
    let role = await prisma.role.findFirst({
      where: { name: roleData.name, companyId: null },
    });

    if (!role) {
      role = await prisma.role.create({
        data: {
          id: crypto.randomUUID(),
          name: roleData.name,
          companyId: null,
          isCustom: false,
        },
      });
    }
    roleMap.set(role.name, role.id);
  }
  console.log('✅ Đã khởi tạo xong System Roles.');

  // ==========================================
  // 2. SEED PERMISSIONS (Quyền hạt nhân)
  // ==========================================
  const permissionsData = [
    // Nhóm Job
    { code: 'JOB_CREATE', module: 'JOB', description: 'Tạo tin tuyển dụng mới' },
    { code: 'JOB_UPDATE', module: 'JOB', description: 'Cập nhật tin tuyển dụng' },
    { code: 'JOB_DELETE', module: 'JOB', description: 'Xóa tin tuyển dụng' },
    { code: 'JOB_VIEW', module: 'JOB', description: 'Xem tin tuyển dụng' },
    { code: 'JOB_PUBLISH', module: 'JOB', description: 'Xuất bản tin tuyển dụng' },

    // Nhóm ATS & Hồ sơ
    { code: 'CV_VIEW', module: 'ATS', description: 'Xem hồ sơ ứng viên' },
    { code: 'CV_DOWNLOAD', module: 'ATS', description: 'Tải xuống tệp CV của ứng viên' },
    { code: 'APPLICATION_STATUS_UPDATE', module: 'ATS', description: 'Cập nhật trạng thái ứng ứng viên' },

    // Nhóm Tổ chức & Nhân sự
    { code: 'ROLE_CREATE', module: 'COMPANY', description: 'Tạo vai trò tùy chỉnh' },
    { code: 'USER_INVITE', module: 'COMPANY', description: 'Mời nhân sự mới vào công ty' },
  ];

  const permMap = new Map<string, number>();

  for (const perm of permissionsData) {
    const permission = await prisma.permission.upsert({
      where: { code: perm.code },
      update: {},
      create: {
        code: perm.code,
        module: perm.module,
        description: perm.description,
      },
    });
    permMap.set(permission.code, permission.id);
  }
  console.log('✅ Đã khởi tạo xong Permissions.');

  // ==========================================
  // 3. LIÊN KẾT ROLE VỚI PERMISSIONS (Bảng role_permissions)
  // ==========================================
  const ownerRoleId = roleMap.get('Owner');
  const hiringManagerRoleId = roleMap.get('Hiring Manager');

  const allPermissionIds = Array.from(permMap.values());

  if (ownerRoleId) {
    for (const permId of allPermissionIds) {
      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: ownerRoleId,
            permissionId: permId,
          },
        },
        update: {},
        create: {
          roleId: ownerRoleId,
          permissionId: permId,
        },
      });
    }
    console.log('🔗 Đã gán toàn bộ quyền cho role: Owner');
  }

  const hiringManagerPermissions = ['CV_VIEW', 'CV_DOWNLOAD', 'APPLICATION_STATUS_UPDATE', 'JOB_VIEW'];
  if (hiringManagerRoleId) {
    for (const code of hiringManagerPermissions) {
      const permId = permMap.get(code);
      if (permId) {
        await prisma.rolePermission.upsert({
          where: {
            roleId_permissionId: {
              roleId: hiringManagerRoleId,
              permissionId: permId,
            },
          },
          update: {},
          create: {
            roleId: hiringManagerRoleId,
            permissionId: permId,
          },
        });
      }
    }
    console.log('🔗 Đã gán quyền chuyên môn cho role: Hiring Manager');
  }

  // ==========================================
  // 4. SEED SKILLS (Từ điển kỹ năng cơ bản)
  // ==========================================
  const skillsData = ['React.js', 'NestJS', 'Node.js', 'PostgreSQL', 'TypeScript', 'Docker', 'AWS'];

  for (const skillName of skillsData) {
    await prisma.skill.upsert({
      where: { name: skillName },
      update: {},
      create: { name: skillName },
    });
  }
  console.log('✅ Đã seed xong Skills (Từ điển kỹ năng).');

  console.log('🎉 Quá trình Seed Database hoàn tất thành công và đã liên kết quyền!');
}

main()
  .catch((e) => {
    console.error('❌ Lỗi trong quá trình seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
