import { AdCampaign, AdVariant, ease, interpolate, useAdTime } from "@qraft-ad-posters/runtime";
import { TapwiseBadge, TapwiseCta, TapwiseShell } from "@qraft-ad-posters/templates";
import { BookOpen, CheckCircle2, Clock3, FileText, GraduationCap, Sparkles, UploadCloud } from "lucide-react";
import "@qraft-ad-posters/templates/tapwise/styles.css";

const campaignId = "linkedin-first-banner-44efbd";
const assetBase = `/campaign-assets/q-tapwise/${campaignId}/assets`;

const variants = [
  {
    id: "landscape-1200x628",
    label: "A - Product Proof",
    width: 1200,
    height: 628,
    placement: "LinkedIn landscape/link ad",
  },
  {
    id: "linkedin-topic-cards",
    label: "B - Topic Cards",
    width: 1200,
    height: 628,
    placement: "LinkedIn landscape/link ad",
  },
  {
    id: "linkedin-parent-focus",
    label: "C - Parent Focus",
    width: 1200,
    height: 628,
    placement: "LinkedIn landscape/link ad",
  },
] as const;

type VariantId = typeof variants[number]["id"];

const copyByVariant: Record<VariantId, {
  badge: string;
  title: string;
  body: string;
  cta: string;
  proof: string;
}> = {
  "landscape-1200x628": {
    badge: "Voor leerlingen en ouders",
    title: "Oefenen met je eigen lesstof.",
    body: "Upload notities of een hoofdstuk. Tapwise maakt er oefenvragen en samenvattingen van.",
    cta: "Ontdek Tapwise",
    proof: "Eigen materiaal",
  },
  "linkedin-topic-cards": {
    badge: "Van materiaal naar leerroute",
    title: "Een topic wordt meteen bruikbaar.",
    body: "Tapwise zet dezelfde lesstof om naar quizzen, samenvattingen, slides en meer.",
    cta: "Bekijk wat kan",
    proof: "Meerdere werkvormen",
  },
  "linkedin-parent-focus": {
    badge: "Minder opstartstress",
    title: "Help je kind sneller beginnen.",
    body: "Van losse notities naar een duidelijk oefenplan met concrete leerstappen.",
    cta: "Probeer Tapwise",
    proof: "Rustig leerplan",
  },
};

const moduleCards = [
  {
    title: "Geschiedenis",
    kind: "Quiz",
    image: "supabase/topics-2dd5d832-0f38-4f9e-95bb-3162a3094c1d-thumbnail_url.png",
    icon: BookOpen,
  },
  {
    title: "Aardrijkskunde",
    kind: "Samenvatting",
    image: "supabase/topics-e18d0dba-c231-4aa7-8a23-1f1cf2439470-thumbnail_url.png",
    icon: FileText,
  },
  {
    title: "Economie",
    kind: "Oefenplan",
    image: "supabase/topics-540bc633-2909-4425-9290-8b72de80eb63-thumbnail_url.png",
    icon: GraduationCap,
  },
  {
    title: "Wereldoriëntatie",
    kind: "Slides",
    image: "supabase/topics-2e9dd48c-1234-453d-a64a-f5ad5415b309-thumbnail_url.png",
    icon: Sparkles,
  },
  {
    title: "Kaartlezen",
    kind: "Luisteren",
    image: "supabase/topics-b38283c0-cbc2-4111-b7af-50756ad94eb2-thumbnail_url.png",
    icon: Clock3,
  },
];

function LinkedinBanner({ variantId }: { variantId: VariantId }) {
  const time = useAdTime();
  const intro = ease(interpolate(time, [0, 700], [0, 1]));
  const visual = ease(interpolate(time, [450, 1300], [0, 1]));
  const proof = ease(interpolate(time, [1050, 1900], [0, 1]));
  const cta = ease(interpolate(time, [1650, 2500], [0, 1]));
  const introY = interpolate(intro, [0, 1], [20, 0]);
  const visualY = interpolate(visual, [0, 1], [20, 0]);
  const visualScale = interpolate(visual, [0, 1], [0.985, 1]);
  const proofY = interpolate(proof, [0, 1], [12, 0]);
  const ctaY = interpolate(cta, [0, 1], [12, 0]);
  const copy = copyByVariant[variantId];

  return (
    <TapwiseShell>
      <div className={`tw-linkedin-banner tw-linkedin-banner-${variantId}`}>
        <section className="tw-linkedin-copy" style={{ opacity: intro, transform: `translateY(${introY}px)` }}>
          <BrandRow />
          <TapwiseBadge>{copy.badge}</TapwiseBadge>
          <h1 className="tw-linkedin-title">{copy.title}</h1>
          <p className="tw-linkedin-body">{copy.body}</p>
          <div className="tw-linkedin-footer" style={{ opacity: cta, transform: `translateY(${ctaY}px)` }}>
            <TapwiseCta>{copy.cta}</TapwiseCta>
            <span className="tw-linkedin-mini-proof"><UploadCloud size={18} /> {copy.proof}</span>
          </div>
        </section>

        <section className="tw-linkedin-visual" style={{ opacity: visual, transform: `translateY(${visualY}px) scale(${visualScale})` }}>
          {variantId === "landscape-1200x628" ? <ProductProofVisual proof={proof} proofY={proofY} /> : null}
          {variantId === "linkedin-topic-cards" ? <TopicCardsVisual proof={proof} proofY={proofY} /> : null}
          {variantId === "linkedin-parent-focus" ? <ParentFocusVisual proof={proof} proofY={proofY} /> : null}
        </section>
      </div>

      <style>{css}</style>
    </TapwiseShell>
  );
}

function BrandRow() {
  return (
    <div className="tw-linkedin-brand-row">
      <img className="tw-linkedin-logo" src={`${assetBase}/tapwise-logo.svg`} alt="" />
      <span className="tw-linkedin-brand">Tapwise</span>
      <span className="tw-ad-beta">Beta</span>
    </div>
  );
}

function ProductProofVisual({ proof, proofY }: { proof: number; proofY: number }) {
  return (
    <>
      <div className="tw-linkedin-image-card">
        <img
          className="tw-linkedin-quiz-image"
          src={`${assetBase}/supabase/topics-03c11254-bcdb-4d89-8fd5-8712a417d674-thumbnail_url.png`}
          alt=""
        />
        <div className="tw-linkedin-image-overlay" />
      </div>
      <div className="tw-linkedin-product-card">
        <div className="tw-linkedin-product-top">
          <span><Sparkles size={16} /> Vandaag oefenen</span>
          <strong>3 taken klaar</strong>
        </div>
        <div className="tw-linkedin-topic-card">
          <span>Eigen lesmateriaal</span>
          <strong>Aardrijkskunde hoofdstuk 4</strong>
          <small>Van upload naar oefening</small>
        </div>
        <div className="tw-linkedin-task-list" style={{ opacity: proof, transform: `translateY(${proofY}px)` }}>
          <div><CheckCircle2 size={18} /> 12 oefenvragen gemaakt</div>
          <div><CheckCircle2 size={18} /> Kernpunten samengevat</div>
          <div><CheckCircle2 size={18} /> Klaar om te leren</div>
        </div>
      </div>
    </>
  );
}

function TopicCardsVisual({ proof, proofY }: { proof: number; proofY: number }) {
  return (
    <div className="tw-topic-card-stage" style={{ opacity: proof, transform: `translateY(${proofY}px)` }}>
      {moduleCards.slice(0, 4).map((card, index) => (
        <ModuleCard key={card.title} card={card} index={index} />
      ))}
      <div className="tw-topic-card-summary">
        <span><Sparkles size={16} /> 1 upload</span>
        <strong>4 manieren om te leren</strong>
      </div>
    </div>
  );
}

function ParentFocusVisual({ proof, proofY }: { proof: number; proofY: number }) {
  return (
    <div className="tw-parent-panel" style={{ opacity: proof, transform: `translateY(${proofY}px)` }}>
      <div className="tw-parent-topic">
        <img src={`${assetBase}/supabase/topics-2dd5d832-0f38-4f9e-95bb-3162a3094c1d-thumbnail_url.png`} alt="" />
        <div>
          <span>Deze week oefenen</span>
          <strong>Geschiedenis proefwerk</strong>
        </div>
      </div>
      <div className="tw-parent-plan">
        <div><CheckCircle2 size={18} /> Samenvatting lezen</div>
        <div><CheckCircle2 size={18} /> 15 oefenvragen maken</div>
        <div><CheckCircle2 size={18} /> Lastige punten herhalen</div>
      </div>
      <div className="tw-parent-card-row">
        {moduleCards.slice(0, 3).map((card, index) => (
          <ModuleCard key={card.title} card={card} index={index} small />
        ))}
      </div>
    </div>
  );
}

function ModuleCard({
  card,
  index,
  small = false,
}: {
  card: typeof moduleCards[number];
  index: number;
  small?: boolean;
}) {
  const Icon = card.icon;
  return (
    <article className={`tw-module-card tw-module-card-${index} ${small ? "tw-module-card-small" : ""}`}>
      <img src={`${assetBase}/${card.image}`} alt="" />
      <div>
        <span><Icon size={15} /> {card.kind}</span>
        <strong>{card.title}</strong>
      </div>
    </article>
  );
}

const css = `
  .tw-linkedin-banner {
    position: relative;
    z-index: 1;
    display: grid;
    grid-template-columns: minmax(0, 0.92fr) minmax(500px, 1fr);
    align-items: center;
    gap: 46px;
    width: 100%;
    height: 100%;
  }

  .tw-linkedin-copy,
  .tw-linkedin-visual {
    min-width: 0;
  }

  .tw-linkedin-brand-row {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 24px;
    color: #1c1c22;
    font-size: 23px;
    font-weight: 650;
  }

  .tw-linkedin-logo {
    width: 46px;
    height: 46px;
    border-radius: 14px;
    box-shadow: 0 10px 28px rgba(28, 28, 34, 0.08);
  }

  .tw-linkedin-brand {
    letter-spacing: 0;
  }

  .tw-linkedin-title {
    max-width: 10.8ch;
    margin: 22px 0 0;
    color: #1c1c22;
    font-size: 66px;
    font-weight: 650;
    letter-spacing: 0;
    line-height: 1.02;
    text-wrap: balance;
  }

  .tw-linkedin-body {
    max-width: 38ch;
    margin: 20px 0 0;
    color: #6b6b7a;
    font-size: 21px;
    font-weight: 420;
    line-height: 1.42;
  }

  .tw-linkedin-mini-proof {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    border: 1px solid rgba(232, 232, 236, 0.95);
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.72);
    color: #555b6d;
    font-size: 14px;
    font-weight: 600;
    line-height: 1;
    padding: 9px 12px;
    box-shadow: 0 8px 22px rgba(28, 28, 34, 0.04);
  }

  .tw-linkedin-mini-proof svg {
    color: #fd6521;
  }

  .tw-linkedin-footer {
    display: flex;
    align-items: center;
    gap: 14px;
    margin-top: 22px;
  }

  .tw-linkedin-footer .tw-ad-cta {
    font-size: 22px;
    padding: 0.7em 0.95em;
  }

  .tw-linkedin-visual {
    position: relative;
    min-height: 470px;
  }

  .tw-linkedin-image-card {
    position: absolute;
    inset: 18px 26px auto auto;
    width: 420px;
    height: 420px;
    overflow: hidden;
    border: 1px solid rgba(255, 255, 255, 0.86);
    border-radius: 36px;
    background: rgba(255, 255, 255, 0.84);
    box-shadow: 0 26px 74px rgba(28, 28, 34, 0.11);
    transform: rotate(2deg);
  }

  .tw-linkedin-quiz-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: center;
  }

  .tw-linkedin-image-overlay {
    position: absolute;
    inset: 0;
    background: linear-gradient(180deg, rgba(250, 248, 246, 0) 35%, rgba(250, 248, 246, 0.32) 100%);
    pointer-events: none;
  }

  .tw-linkedin-product-card,
  .tw-parent-panel,
  .tw-topic-card-summary {
    border: 1px solid rgba(255, 255, 255, 0.88);
    border-radius: 32px;
    background: rgba(255, 255, 255, 0.88);
    box-shadow: 0 24px 70px rgba(28, 28, 34, 0.1);
    backdrop-filter: blur(18px);
  }

  .tw-linkedin-product-card {
    position: absolute;
    left: 0;
    bottom: 16px;
    width: 390px;
    padding: 24px;
  }

  .tw-linkedin-product-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 14px;
    color: #6b6b7a;
    font-size: 15px;
    font-weight: 650;
  }

  .tw-linkedin-product-top span,
  .tw-linkedin-product-top strong {
    display: inline-flex;
    align-items: center;
    gap: 7px;
  }

  .tw-linkedin-product-top svg,
  .tw-linkedin-product-top strong {
    color: #fd6521;
  }

  .tw-linkedin-topic-card {
    display: grid;
    gap: 7px;
    margin-top: 22px;
    border: 1px solid #e8e8ec;
    border-radius: 22px;
    background: rgba(250, 248, 246, 0.82);
    padding: 19px;
  }

  .tw-linkedin-topic-card span,
  .tw-topic-card-summary span,
  .tw-parent-topic span {
    color: #fd6521;
    font-size: 12px;
    font-weight: 700;
    text-transform: uppercase;
  }

  .tw-linkedin-topic-card strong,
  .tw-parent-topic strong {
    color: #1c1c22;
    font-size: 25px;
    font-weight: 650;
    line-height: 1.1;
  }

  .tw-linkedin-topic-card small {
    color: #6b6b7a;
    font-size: 15px;
    font-weight: 520;
  }

  .tw-linkedin-task-list {
    display: grid;
    gap: 10px;
    margin-top: 16px;
  }

  .tw-linkedin-task-list div,
  .tw-parent-plan div {
    display: flex;
    align-items: center;
    gap: 10px;
    border: 1px solid #e8e8ec;
    border-radius: 16px;
    background: rgba(255, 255, 255, 0.74);
    color: #1c1c22;
    font-size: 15px;
    font-weight: 620;
    padding: 11px 13px;
  }

  .tw-linkedin-task-list svg,
  .tw-parent-plan svg {
    color: #fd6521;
    flex: 0 0 auto;
  }

  .tw-topic-card-stage {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    align-content: center;
    gap: 14px;
    min-height: 470px;
  }

  .tw-module-card {
    position: absolute;
    display: grid;
    grid-template-columns: 112px minmax(0, 1fr);
    gap: 16px;
    align-items: center;
    width: 330px;
    border: 1px solid rgba(255, 255, 255, 0.88);
    border-radius: 28px;
    background: rgba(255, 255, 255, 0.9);
    padding: 13px;
    box-shadow: 0 22px 58px rgba(28, 28, 34, 0.1);
  }

  .tw-module-card img {
    width: 112px;
    height: 112px;
    border-radius: 22px;
    object-fit: cover;
  }

  .tw-module-card div {
    display: grid;
    gap: 8px;
  }

  .tw-module-card span,
  .tw-parent-topic span {
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }

  .tw-module-card span {
    color: #fd6521;
    font-size: 13px;
    font-weight: 700;
  }

  .tw-module-card strong {
    color: #1c1c22;
    font-size: 23px;
    font-weight: 650;
    line-height: 1.08;
  }

  .tw-module-card-0 { left: 0; top: 12px; transform: rotate(-2deg); }
  .tw-module-card-1 { right: 12px; top: 70px; transform: rotate(2deg); }
  .tw-module-card-2 { left: 42px; bottom: 80px; transform: rotate(1deg); }
  .tw-module-card-3 { right: 0; bottom: 20px; transform: rotate(-1.5deg); }

  .tw-topic-card-stage .tw-module-card {
    position: static;
    width: auto;
    grid-template-columns: 96px minmax(0, 1fr);
    border-radius: 24px;
    padding: 12px;
    transform: none;
  }

  .tw-topic-card-stage .tw-module-card img {
    width: 96px;
    height: 96px;
    border-radius: 20px;
  }

  .tw-topic-card-stage .tw-module-card strong {
    font-size: 19px;
  }

  .tw-topic-card-summary {
    display: flex;
    grid-column: 1 / -1;
    align-items: center;
    justify-content: space-between;
    gap: 7px;
    padding: 20px 22px;
  }

  .tw-topic-card-summary span {
    display: inline-flex;
    align-items: center;
    gap: 7px;
  }

  .tw-topic-card-summary strong {
    color: #1c1c22;
    font-size: 24px;
    font-weight: 650;
    line-height: 1.1;
  }

  .tw-parent-panel {
    display: grid;
    gap: 18px;
    width: 500px;
    margin: 10px 18px 0 auto;
    padding: 24px;
  }

  .tw-parent-topic {
    display: grid;
    grid-template-columns: 130px minmax(0, 1fr);
    gap: 18px;
    align-items: center;
    border: 1px solid #e8e8ec;
    border-radius: 26px;
    background: rgba(250, 248, 246, 0.82);
    padding: 15px;
  }

  .tw-parent-topic img {
    width: 130px;
    height: 130px;
    border-radius: 22px;
    object-fit: cover;
  }

  .tw-parent-topic div {
    display: grid;
    gap: 9px;
  }

  .tw-parent-plan {
    display: grid;
    gap: 10px;
  }

  .tw-parent-card-row {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 10px;
  }

  .tw-parent-card-row .tw-module-card {
    position: static;
    width: auto;
    grid-template-columns: 1fr;
    gap: 9px;
    border-radius: 20px;
    padding: 10px;
    transform: none;
  }

  .tw-parent-card-row .tw-module-card img {
    width: 100%;
    height: 78px;
    border-radius: 16px;
  }

  .tw-parent-card-row .tw-module-card span {
    font-size: 11px;
  }

  .tw-parent-card-row .tw-module-card strong {
    font-size: 14px;
  }
`;

export default function Campaign() {
  return (
    <AdCampaign title="LinkedIn First Banner" durationMs={4200} fps={30}>
      {variants.map((variant) => (
        <AdVariant key={variant.id} {...variant}>
          <LinkedinBanner variantId={variant.id} />
        </AdVariant>
      ))}
    </AdCampaign>
  );
}
