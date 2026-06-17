import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from api.models import Company, CompanyDocument

print(f"Total Companies: {Company.objects.count()}")
print(f"Total Documents: {CompanyDocument.objects.count()}")

for c in Company.objects.all():
    print(f"\nCompany: {c.nome} (Status: {c.status})")
    docs = c.documents.all()
    print(f"  Docs count: {docs.count()}")
    for d in docs:
        print(f"    - {d.tipo}: {d.arquivo_url} (Aprovado: {d.aprovado})")
