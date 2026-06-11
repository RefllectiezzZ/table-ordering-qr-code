import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SupportEmailLink } from "@/components/legal/legal-notice";
import { getPlatformName } from "@/lib/platform-config";
import { requireRestaurantUser } from "@/lib/security/guards";

export const dynamic = "force-dynamic";

export const metadata = { title: "Ajuda" };

export default async function RestaurantHelpPage() {
  await requireRestaurantUser();
  const platform = getPlatformName();

  return (
    <div className="p-4 sm:p-6">
      <div className="mb-5">
        <h1 className="text-xl font-bold text-slate-900">Ajuda e suporte</h1>
        <p className="text-sm text-slate-500">
          Informação útil para operação diária e contacto com o fornecedor da plataforma.
        </p>
      </div>

      <div className="grid max-w-3xl gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Contacto de suporte</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-slate-700">
            <p>
              Plataforma: <strong>{platform}</strong>
            </p>
            <p>
              Email: <SupportEmailLink />
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Se algo correr mal</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-slate-700">
            <ul className="list-disc space-y-1 pl-5">
              <li>
                Para parar pedidos temporariamente, use{" "}
                <Link href="/restaurant/settings" className="text-sky-700 underline">
                  Definições → Disponibilidade de pedidos
                </Link>
                .
              </li>
              <li>Se o menu público não carregar, continue o serviço pelo processo habitual do restaurante.</li>
              <li>Quando voltar online, confirme pedidos pendentes e feche sessões de mesa se necessário.</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Informação legal</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3 text-sm">
            <Link href="/legal/privacy" className="text-sky-700 underline">
              Privacidade
            </Link>
            <Link href="/legal/terms" className="text-sky-700 underline">
              Termos
            </Link>
            <Link href="/legal/data-processing" className="text-sky-700 underline">
              Tratamento de dados
            </Link>
            <Link href="/legal/support" className="text-sky-700 underline">
              Suporte
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Conta da mesa — aviso importante</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-slate-700">
            <p>
              A &quot;Conta da mesa&quot; é um resumo operacional. Não processa pagamento nem emite
              fatura. O pagamento e a documentação fiscal devem ser tratados fora do sistema.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
