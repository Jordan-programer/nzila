# Nzila — Venda de Bilhetes Interprovinciais Online (Angola)

O **Nzila** é uma plataforma moderna e premium para a reserva e venda de bilhetes de autocarro interprovinciais em Angola. A aplicação permite que os utilizadores pesquisem viagens, escolham assentos, efetuem pagamentos digitais e obtenham um bilhete digital seguro com QR Code.

---

## 🛠️ Tecnologias Utilizadas

### Frontend
- **Framework:** [Next.js](https://nextjs.org/) (React) com App Router.
- **Estilização:** [Tailwind CSS](https://tailwindcss.com/) com design system customizado em [tailwind.css](file:///c:/nzila/frontend/src/styles/tailwind.css).
- **Tipografia:** Google Fonts **Nunito Sans** (carregada via `next/font/google` no [layout.tsx](file:///c:/nzila/frontend/src/app/layout.tsx)) com letter-spacing customizado para assemelhar-se à interface do *Booking.com*.
- **Ícones:** [Lucide React](https://lucide.dev/).
- **Formulários:** [React Hook Form](https://react-hook-form.com/) para validações de login e registo.
- **Notificações:** [Sonner](https://sonner.emilkowal.ski/) para feedback visual imediato em toasts.

### Backend
- **Framework:** [Django](https://www.djangoproject.com/) com [Django REST Framework (DRF)](https://www.django-rest-framework.org/) para a disponibilização das APIs RESTful.
- **Autenticação:** Baseada em Tokens do Django (`TokenAuthentication`).
- **Base de Dados:**
  - Desenvolvimento: **SQLite** (padrão local `db.sqlite3`).
  - Produção/Escalabilidade: Script **MySQL** gerado sob medida ([nzila_mysql.sql](file:///c:/nzila/backend/nzila_mysql.sql)).
- **Notificações por Email:** Integração via SMTP do Gmail para envio automático de confirmações.

---

## 🚀 Funcionalidades & Arquitetura Recente

1. **UX Aprimorado na Seleção de Viagens:**
   - No componente [TripCard.tsx](file:///c:/nzila/frontend/src/app/results-page/components/TripCard.tsx), o sistema verifica se o utilizador já possui sessão iniciada através do `localStorage`. 
   - Se já estiver autenticado, ao selecionar a viagem, o utilizador é enviado diretamente para a página de pagamento (`/payment?trip=...`), pulando a barreira desnecessária de login.

2. **Design Visual "Booking.com Style":**
   - Implementação de um ecossistema tipográfico focado em desempenho e estética.
   - Substituição da fonte padrão para **Nunito Sans** combinada com `letter-spacing: -0.01em` no body global, oferecendo uma UI compacta, limpa e altamente profissional.


---

## 💻 Como Iniciar o Projeto

### Pré-requisitos
- Node.js (v18+)
- Python (v3.10+)

### Executar o Frontend
```bash
cd frontend
npm install
npm run dev
```
*Aceda a `http://localhost:3000` no seu navegador.*

### Executar o Backend Django
```bash
cd backend
# Crie e ative o ambiente virtual (venv)
python -m venv venv
./venv/Scripts/activate # Windows

# Instale os requisitos
pip install -r requirements.txt

# Execute as migrações e inicie o servidor
python manage.py migrate
python manage.py runserver
```
*A API estará disponível em `http://localhost:8000/api/`.*
