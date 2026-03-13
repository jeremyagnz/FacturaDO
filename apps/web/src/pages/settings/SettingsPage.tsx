import { Settings } from 'lucide-react';

export function SettingsPage() {
  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold">Configuración</h1>
        <p className="text-muted-foreground">Gestiona tu cuenta y preferencias del sistema</p>
      </div>

      <div className="bg-white border rounded-xl divide-y">
        {[
          { title: 'Perfil de Usuario', desc: 'Actualiza tu nombre, correo y contraseña' },
          { title: 'Notificaciones', desc: 'Configura alertas por correo y sistema' },
          { title: 'Certificados Digitales', desc: 'Gestiona certificados PKCS#12 para firma' },
          { title: 'Integración DGII', desc: 'Configura ambiente y credenciales DGII' },
          { title: 'API Keys', desc: 'Genera claves para integración con sistemas externos' },
          { title: 'Facturación', desc: 'Configuración de secuencias y series de NCF' },
        ].map(({ title, desc }) => (
          <div
            key={title}
            className="flex items-center justify-between px-6 py-4 hover:bg-muted/30 cursor-pointer transition-colors"
          >
            <div>
              <p className="font-medium">{title}</p>
              <p className="text-sm text-muted-foreground">{desc}</p>
            </div>
            <Settings className="h-5 w-5 text-muted-foreground" />
          </div>
        ))}
      </div>
    </div>
  );
}
