import { Deck } from "@micro-keynote/deck-runtime";
import { SoftEditorial } from "@micro-keynote/templates";
import "@micro-keynote/templates/soft-editorial/styles.css";

export default function GeneratedDeck() {
  return (
    <Deck theme="soft-editorial" title="NL-Alert & Burgernet — UI Changes" width={1920} height={1080}>
      <Monochrome.Cover
  topLabel="NL-Alert & Burgernet · Sprint 93.1"
  title="UI Changes Overview"
  lead="A slide-by-slide walkthrough of all interface changes shipped this sprint."
  metaLeft="LMSMMA · June 2026"
  metaRight="Internal"
/>
      <Monochrome.ImageLeft
  label="NL-Alert & Burgernet"
  page="01"
  kicker="Location Settings"
  title="Remove radius slider from custom locations"
  body="The distance slider (250m–1km) gave users a false impression of how alerts work. In reality, the control room defines the geofence per alert — if you are inside it, you receive the message. Your radius setting has no effect on delivery. Removing the slider eliminates a misleading mental model and reduces negative reviews."
  image="/deck-assets/tapwise/nl-alert-burgernet-ui-changes-68cb0c/assets/custom-location-screen-mpvamqt4.jpg"
  caption="Current screen — distance slider is being removed · LMSMMA-1060"
/>
      <Monochrome.ImageLeft
  label="NL-Alert · Android"
  page="02"
  kicker="Location Settings"
  title="Remove default/fallback location"
  body="The app previously fell back to a default location when no custom location was set. This could cause users to receive alerts irrelevant to their actual whereabouts. The fallback location is now removed — users either set an explicit location or rely on device GPS only."
  image="https://placehold.co/600x900/f2f2d2/1a1a16?text=NL-Alert%0ALocation+Screen"
  caption="NL-Alert location settings — fallback removed · LMSMMA-1096"
/>
      <Monochrome.ImageLeft
  label="Burgernet · Android"
  page="03"
  kicker="Location Settings"
  title="Remove default/fallback location"
  body="Same principle as NL-Alert: Burgernet's default/fallback location is removed. Users must set an explicit custom location or use device GPS. This ensures alerts are only delivered based on accurate, intentional location data — not a stale fallback."
  image="https://placehold.co/600x900/f2f2d2/1a1a16?text=Burgernet%0ALocation+Screen"
  caption="Burgernet location settings — fallback removed · LMSMMA-1152"
/>
      <Monochrome.ImageLeft
  label="112NL · Android"
  page="04"
  kicker="Try Me Out"
  title="Waiting screen UI fixes"
  body="The waiting screen shown before connecting to a test call had layout and visual issues on Android. Spacing, button alignment and loading state feedback have been corrected so the screen presents clearly while the user waits for the chat to start."
  image="https://placehold.co/600x900/f2f2d2/1a1a16?text=112NL%0AWaiting+Screen"
  caption="Try Me Out — waiting screen after fix · LMSMMA-1158"
/>
      <Monochrome.ImageLeft
  label="112NL · Android"
  page="05"
  kicker="Try Me Out"
  title="Information carousel UI fix"
  body="The information carousel shown during the Try Me Out onboarding flow had visual alignment issues on Android. Card transitions, text truncation and indicator dots have been corrected to provide a smooth, readable intro experience before the test call begins."
  image="https://placehold.co/600x900/f2f2d2/1a1a16?text=112NL%0ACarousel+Screen"
  caption="Try Me Out — information carousel after fix · LMSMMA-1155"
/>
      <Monochrome.ImageLeft
  label="Burgernet · iOS"
  page="06"
  kicker="Landscape Support"
  title="Homepage landscape layout"
  body="The Burgernet homepage on iOS now fully supports landscape orientation. Navigation elements, alert cards and call-to-action buttons reflow correctly in wide mode. This is the first of multiple bundles receiving landscape support this sprint."
  image="https://placehold.co/900x600/f2f2d2/1a1a16?text=Burgernet+iOS%0AHomepage+Landscape"
  caption="Burgernet iOS homepage — landscape mode · LMSMMA-696"
/>
      <Monochrome.ImageLeft
  label="NL-Alert · Backend / Notification"
  page="07"
  kicker="Alert Message"
  title="Full alert message shown — not just English part"
  body="NL-Alert notifications were only displaying the English portion of multilingual alerts. The full message — including Dutch and other languages — now renders correctly in the notification and in-app view, ensuring all users receive the complete alert content."
  image="https://placehold.co/600x900/f2f2d2/1a1a16?text=NL-Alert%0ANotification+View"
  caption="NL-Alert notification — full message now shown · LMSMMA-1175"
/>
      <SoftEditorial.Cover
        kicker="New deck"
        title="NL-Alert & Burgernet — UI Changes"
      />
    </Deck>
  );
}
