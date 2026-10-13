/** Build QA: mismo perfil que producción (sin accesos demo). Ajuste apiUrl al despliegue de QA. */
export const environment = {
  production: true,
  enableDemoLogin: false,
  apiUrl: `${window.location.protocol}//royal-escolar-api.rsdev.site/api/v1`,
  appName: 'EscolarERP',
  version: '1.0.0',
  tokenExpirationWarning: 300,
  sessionTimeout: 3600,
  maxFileSize: 10485760,
  allowedFileTypes: ['image/jpeg', 'image/png', 'application/pdf'],
  pagination: { defaultPageSize: 20, pageSizeOptions: [10, 20, 50, 100] },
};
