import { LegalPage } from "@/components/legal/legal-page";
import { getAppLanguage } from "@/lib/i18n/server";

export const dynamic = "force-dynamic";

export const metadata = { title: "Aviso sobre Alergénios / Allergen Notice" };

export default async function AllergenDisclaimerPage() {
  const lang = await getAppLanguage();

  if (lang === "pt") {
    return (
      <LegalPage title="Aviso sobre Alergénios e Traduções (rascunho)" lang={lang}>
        <DisclaimerPt />
      </LegalPage>
    );
  }
  return (
    <LegalPage title="Allergen and Translation Notice (draft)" lang={lang}>
      <DisclaimerEn />
    </LegalPage>
  );
}

function DisclaimerPt() {
  return (
    <>
      <section>
        <h2>Informação de alergénios</h2>
        <p>
          Os menus nesta plataforma podem assinalar os 14 alergénios de declaração obrigatória na
          União Europeia (Regulamento (UE) n.º 1169/2011): glúten, crustáceos, ovos, peixe,
          amendoins, soja, leite, frutos de casca rija, aipo, mostarda, sésamo, sulfitos, tremoço
          e moluscos.
        </p>
        <ul>
          <li>
            A informação de alergénios é introduzida e validada por cada restaurante. A plataforma
            apenas a apresenta.
          </li>
          <li>
            As cozinhas trabalham com muitos ingredientes ao mesmo tempo. A contaminação cruzada
            nunca pode ser totalmente excluída.
          </li>
          <li>
            <strong>
              Se tem uma alergia ou intolerância alimentar, confirme sempre diretamente com a
              equipa do restaurante antes de pedir e antes de consumir.
            </strong>
          </li>
        </ul>
      </section>
      <section>
        <h2>Traduções</h2>
        <p>
          As traduções do menu (português, inglês, espanhol e francês) podem ser preparadas
          manualmente ou com apoio de ferramentas externas, num fluxo de revisão por CSV. O
          restaurante é responsável por rever e aprovar as traduções antes de as publicar. Em
          caso de dúvida ou contradição, prevalecem a versão no idioma base do restaurante e a
          confirmação da equipa.
        </p>
      </section>
      <section>
        <h2>Estado deste documento</h2>
        <p>
          Rascunho para a fase de MVP. Tem de ser revisto por um profissional qualificado antes
          do lançamento comercial.
        </p>
      </section>
    </>
  );
}

function DisclaimerEn() {
  return (
    <>
      <section>
        <h2>Allergen information</h2>
        <p>
          Menus on this platform can flag the 14 allergens that require declaration in the
          European Union (Regulation (EU) No 1169/2011): gluten, crustaceans, eggs, fish,
          peanuts, soybeans, milk, tree nuts, celery, mustard, sesame, sulphites, lupin and
          molluscs.
        </p>
        <ul>
          <li>
            Allergen information is entered and validated by each restaurant. The platform only
            displays it.
          </li>
          <li>
            Kitchens handle many ingredients at once. Cross-contamination can never be fully
            ruled out.
          </li>
          <li>
            <strong>
              If you have a food allergy or intolerance, always check directly with the
              restaurant staff before ordering and before consuming.
            </strong>
          </li>
        </ul>
      </section>
      <section>
        <h2>Translations</h2>
        <p>
          Menu translations (Portuguese, English, Spanish and French) may be prepared manually or
          with the help of external tools, through a CSV review flow. The restaurant is
          responsible for reviewing and approving translations before publishing them. If a
          translation seems unclear or contradictory, the restaurant&apos;s base-language version
          and the staff&apos;s confirmation prevail.
        </p>
      </section>
      <section>
        <h2>Status of this document</h2>
        <p>
          Draft for the MVP phase. It must be reviewed by a qualified professional before
          commercial launch.
        </p>
      </section>
    </>
  );
}
