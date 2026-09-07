export const metadata = {
  title: 'Tecnored Solar',
  description: 'Cuestionario de factibilidad fotovoltaica',
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body style={{ margin: 0, fontFamily: 'Arial, sans-serif', backgroundColor: '#f5f5f5' }}>
        {children}
      </body>
    </html>
  );
}
