// Kit preview: one product landing composed only from the kit, rendered in
// any direction. Sample product and sample content (a desk air monitor);
// not the app's starter page and never shipped as one.
//
// Recipe (identity.md, product landing): masthead, logo-row, split,
// stat-row, sticky-story, bento, spec-table, quote, feature-grid, pricing,
// faq, cta-band, footer. The masthead variant and footer archetype follow
// the direction; everything else is the same composition.
import { AppShell } from "../../AppShell";
import {
  BentoGrid,
  BentoTile,
  CTABand,
  FAQ,
  FeatureGrid,
  Footer,
  LogoRow,
  Masthead,
  MediaFrame,
  Page,
  PricingTable,
  Quote,
  SpecRail,
  SpecTable,
  Split,
  StatRow,
  StickyStory,
  type DirectionId,
  type FooterVariant,
  type MastheadVariant,
} from "../index";
import { DayReadout, Device, WeekStrip, Wordmark } from "./art";

const HERO: Partial<Record<DirectionId, MastheadVariant>> = { D1: "split", D9: "overlay", D11: "left" };
const FOOT: Partial<Record<DirectionId, FooterVariant>> = { D1: "inline", D9: "statement", D11: "masthead" };

const destinations = [
  { id: "top", label: "Overview", href: "#top" },
  { id: "story", label: "Story", href: "#story" },
  { id: "specs", label: "Specs", href: "#specs" },
  { id: "pricing", label: "Pricing", href: "#pricing" },
];

function Actions({ secondary = "See how it works" }: { secondary?: string }) {
  return (
    <>
      <a className="btn" href="#pricing">
        Buy Hawa One
      </a>
      <a className="btn btn-secondary" href="#story">
        {secondary}
      </a>
    </>
  );
}

function Hero({ direction }: { direction: DirectionId }) {
  const variant = HERO[direction] ?? "split";
  const lead = "A desk monitor that turns CO2, fine dust, and humidity into one plain sentence about the room you are in.";
  if (variant === "overlay") {
    return (
      <Masthead
        id="top"
        variant="overlay"
        title="Air you can read."
        lead={lead}
        actions={<Actions />}
        media={<Device reading="612" unit="ppm CO2" line="Fine for focus" level={2} focus={0.72} label="" />}
      />
    );
  }
  if (variant === "left") {
    return <Masthead id="top" variant="left" title={<Wordmark label="Hawa, air you can read" />} lead={lead} actions={<Actions />} />;
  }
  return (
    <Masthead
      id="top"
      variant="split"
      title="Air you can read."
      lead={lead}
      actions={<Actions />}
      media={
        <MediaFrame kind="view" ratio="4/3" tone="surface" caption="Live readout from a sample desk, updated every minute.">
          <DayReadout />
        </MediaFrame>
      }
    />
  );
}

export function Landing({ direction }: { direction: DirectionId }) {
  return (
    <Page direction={direction}>
      <AppShell title="Hawa" destinations={destinations} current="top" actions={<a className="btn" href="#pricing">Buy</a>}>
        <Hero direction={direction} />

        <LogoRow
          label="Works with the home you already have"
          logos={[{ name: "Matter" }, { name: "Apple Home" }, { name: "Google Home" }, { name: "Home Assistant" }]}
        />

        <Split
          tone="layer"
          ratio="5/7"
          mediaSide="start"
          title="It reads the room, not the city."
          lead="Weather apps report the air outside. Hawa measures the air at your desk, where a closed door and four people can double the CO2 in an hour."
          media={
            <MediaFrame kind="canvas" ratio="4/3" caption="Hawa One, 72 by 96 mm, stone finish.">
              <Device reading="612" unit="ppm CO2" line="Fine for focus" level={2} label="Hawa One on a desk, showing 612 ppm CO2, fine for focus" />
            </MediaFrame>
          }
        >
          <SpecRail
            label="Sensors"
            rows={[
              { label: "CO2", value: "±30", unit: "ppm", note: "NDIR sensor" },
              { label: "Fine dust", value: "0 to 500", unit: "µg/m³", note: "PM2.5, laser" },
              { label: "Temperature", value: "±0.3", unit: "°C" },
              { label: "Humidity", value: "±3", unit: "% RH" },
            ]}
          />
        </Split>

        <StatRow
          label="Hawa One in numbers"
          stats={[
            { value: "±30", unit: "ppm", caption: "CO2 accuracy from 400 to 2000 ppm, NDIR sensor.", signal: true },
            { value: "18", unit: "months", caption: "On one charge at one reading a minute." },
            { value: "180", unit: "g", caption: "Light enough to move to the next meeting room." },
            { value: "2", unit: "min", caption: "From the box to the first reading, no account." },
          ]}
        />

        <StickyStory
          id="story"
          title="From a number to a decision."
          lead="Hawa does three things, in the order you need them."
          steps={[
            {
              title: "It measures",
              body: "Every minute Hawa reads CO2, fine dust, temperature, and humidity, and shows the one that matters most right now.",
              media: (
                <MediaFrame kind="canvas" ratio="1/1">
                  <Device reading="612" unit="ppm CO2" line="Fine for focus" level={2} label="Hawa showing 612 ppm, fine for focus" />
                </MediaFrame>
              ),
            },
            {
              title: "It explains",
              body: "The day view shows when the air turned, so the 3 pm slump has a cause you can see: the meeting room door.",
              media: (
                <MediaFrame kind="view" ratio="1/1" tone="surface">
                  <DayReadout />
                </MediaFrame>
              ),
            },
            {
              title: "It tells you what to do",
              body: "Above 1000 ppm the display says what fixes it, in plain words, and goes quiet again once the room recovers.",
              media: (
                <MediaFrame kind="canvas" ratio="1/1">
                  <Device advice={"Open a\nwindow"} line="1240 ppm, rising" level={5} label="Hawa advising: open a window, 1240 ppm and rising" />
                </MediaFrame>
              ),
            },
          ]}
        />

        <BentoGrid
          tone="layer"
          title="A week on one desk."
          lead="What a single Hawa learned about one room."
          layout={{ lg: ["a a b c", "a a d d"], md: ["a a", "b c", "d d"] }}
        >
          <BentoTile area="a" kind="media" title="Hours above 1000 ppm" body="Wednesday had three back to back meetings with the door closed." media={<WeekStrip />} />
          <BentoTile area="b" kind="stat" value="612" unit="ppm" body="Right now, fine for focus." signal />
          <BentoTile area="c" kind="text" title="No fan, no hum" body="Passive airflow, so it can sit next to a microphone." />
          <BentoTile
            area="d"
            kind="list"
            title="Today"
            items={[
              { label: "Time above 1000 ppm", value: "1.4", unit: "h" },
              { label: "Windows opened", value: "2" },
              { label: "Lowest reading", value: "498", unit: "ppm" },
            ]}
          />
        </BentoGrid>

        <SpecTable
          id="specs"
          title="Specifications"
          lead="Measured values, the way a datasheet states them."
          groups={[
            {
              name: "Sensing",
              rows: [
                { label: "CO2", value: "400 to 5000", unit: "ppm", note: "NDIR, ±30 ppm from 400 to 2000" },
                { label: "Fine dust", value: "0 to 500", unit: "µg/m³", note: "PM2.5, laser scattering" },
                { label: "Temperature", value: "-10 to 50", unit: "°C", note: "±0.3 °C" },
                { label: "Humidity", value: "0 to 100", unit: "% RH", note: "±3% RH" },
              ],
            },
            {
              name: "Display and power",
              rows: [
                { label: "Display", value: "2.9", unit: "in e-paper", note: "296 × 128 pixels" },
                { label: "Battery", value: "2000", unit: "mAh", note: "About 18 months at one reading a minute" },
                { label: "Charging", value: "5", unit: "V", note: "USB-C" },
              ],
            },
            {
              name: "Size and connection",
              rows: [
                { label: "Size", value: "72 × 96 × 28", unit: "mm" },
                { label: "Weight", value: "180", unit: "g" },
                { label: "Wireless", value: "Matter over Thread, Bluetooth LE 5.3" },
              ],
            },
          ]}
        />

        <Quote
          tone="layer"
          quote="We stopped blaming the 3 pm meeting on the agenda. It was the air, and now there is a window rule."
          name="Rina Kartika"
          role="Office manager, a 40 person design studio (sample quote)"
        />

        <FeatureGrid
          title="Built to stay on the desk."
          lead="Three decisions that keep Hawa useful after the first week."
          columns={3}
          items={[
            { title: "Quiet by design", body: "No fan and no chime. Advice appears on the display and nowhere else unless you ask for it." },
            { title: "Private by default", body: "Readings stay on the device and your home hub. There is no account and no cloud to sign in to." },
            { title: "Repairable", body: "The battery and the sensor module come out with one screw, and both are sold as spare parts." },
          ]}
        />

        <PricingTable
          id="pricing"
          tone="layer"
          title="One price, no subscription."
          lead="Every plan includes the day view, advice, and two years of warranty."
          plans={[
            {
              name: "Hawa One",
              price: "1.490.000",
              unit: "IDR",
              summary: "One monitor for one desk or room.",
              features: ["CO2, fine dust, climate", "Day and week view", "Two year warranty"],
              action: <a className="btn" href="#buy">Buy Hawa One</a>,
              recommended: true,
            },
            {
              name: "Room kit",
              price: "3.990.000",
              unit: "IDR",
              summary: "Three monitors for a home or a small office.",
              features: ["Everything in Hawa One", "Shared room view", "CSV export"],
              action: <a className="btn btn-secondary" href="#buy">Buy the room kit</a>,
            },
            {
              name: "Office",
              price: "12.900.000",
              unit: "IDR",
              summary: "Ten monitors, set up by our team.",
              features: ["Everything in Room kit", "On-site setup in Jakarta", "Priority repair"],
              action: <a className="btn btn-secondary" href="#contact">Talk to us</a>,
            },
          ]}
          compare={{
            caption: "Compare plans",
            rows: [
              { label: "Monitors", values: ["1", "3", "10"] },
              { label: "Shared room view", values: [false, true, true] },
              { label: "CSV export", values: [false, true, true] },
              { label: "On-site setup", values: [false, false, true] },
            ],
          }}
        />

        <FAQ
          title="Questions"
          lead="Plain answers about setup, privacy, and batteries."
          items={[
            { q: "Do I need an account or an app?", a: "No. Hawa works on its own. A Matter hub adds history on your phone, still without an account." },
            { q: "How often should I charge it?", a: "About every 18 months at one reading a minute. Faster readings shorten that to about 6 months." },
            { q: "What happens above 1000 ppm?", a: "The display switches to advice, such as opening a window, and switches back once the room is under 800 ppm." },
            { q: "Can I replace the sensor?", a: "Yes. The sensor module comes out with one screw and ships as a spare part." },
          ]}
        />

        <CTABand
          title="Put one on your desk this week."
          lead="Order today and it ships from Jakarta in two working days."
          actions={<Actions secondary="Compare plans" />}
          proof={
            <SpecRail
              label="Order details"
              rows={[
                { label: "Price", value: "1.490.000", unit: "IDR", signal: true },
                { label: "Shipping", value: "2 working days from Jakarta" },
                { label: "Warranty", value: "2", unit: "years" },
              ]}
            />
          }
        />

        <Footer
          variant={FOOT[direction] ?? "inline"}
          brand={FOOT[direction] === "masthead" ? <Wordmark label="Hawa" /> : "Hawa"}
          statement="Air you can read, at the desk where you breathe it."
          links={[
            { label: "Specs", href: "#specs" },
            { label: "Pricing", href: "#pricing" },
            { label: "Support", href: "#support" },
            { label: "Privacy", href: "#privacy" },
          ]}
          legal="Hawa 2026. Kit preview with sample content."
        />
      </AppShell>
    </Page>
  );
}
