// Server-side CV PDF built with @react-pdf/renderer from the same Supabase data
// the site renders. This replaces the old /cv page + window.print() flow: the
// browser's print dialog stamps its own header/footer (URL, date, page count)
// and CSS cannot remove it, so the downloadable artifact is generated here,
// designed for paper from the start.
import {
  Document,
  Page,
  Text,
  View,
  Link,
  Font,
  StyleSheet,
  renderToBuffer,
} from '@react-pdf/renderer';
import type { Profile, Technology, Education, Language, TimelineEntry } from '../types/database';
import type { CvProjectView } from './cv-projection';
// Inlined as data URIs so the standalone server bundle has no filesystem/network
// dependency for fonts.
import albertExtraLight from '../assets/cv-fonts/AlbertSans-ExtraLight.ttf?inline';
import albertMedium from '../assets/cv-fonts/AlbertSans-Medium.ttf?inline';
import albertBold from '../assets/cv-fonts/AlbertSans-Bold.ttf?inline';
import interRegular from '../assets/cv-fonts/Inter-Regular.ttf?inline';
import interMedium from '../assets/cv-fonts/Inter-Medium.ttf?inline';
import interSemiBold from '../assets/cv-fonts/Inter-SemiBold.ttf?inline';

Font.register({
  family: 'Albert Sans',
  fonts: [
    { src: albertExtraLight, fontWeight: 200 },
    { src: albertMedium, fontWeight: 500 },
    { src: albertBold, fontWeight: 700 },
  ],
});

Font.register({
  family: 'Inter',
  fonts: [
    { src: interRegular, fontWeight: 400 },
    { src: interMedium, fontWeight: 500 },
    { src: interSemiBold, fontWeight: 600 },
  ],
});

// Never hyphenate — short columns + hyphens read poorly on a CV.
Font.registerHyphenationCallback((word) => [word]);

const INK = '#141414';
const BODY = '#3d3d3d';
const MUTED = '#8a8a8a';
const HAIRLINE = '#e2e2e2';
const ACCENT = '#e3a857';

const styles = StyleSheet.create({
  page: {
    paddingTop: 40,
    paddingBottom: 48,
    paddingHorizontal: 46,
    fontFamily: 'Inter',
    color: BODY,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  nameBlock: {
    flex: 1,
    paddingRight: 18,
  },
  name: {
    fontFamily: 'Albert Sans',
    fontWeight: 200,
    fontSize: 22,
    letterSpacing: 0.4,
    color: INK,
    textTransform: 'uppercase',
  },
  role: {
    fontSize: 7.5,
    fontWeight: 600,
    letterSpacing: 2.4,
    color: ACCENT,
    textTransform: 'uppercase',
    marginTop: 6,
  },
  contactBlock: {
    alignItems: 'flex-end',
    gap: 2.5,
  },
  contactLine: {
    fontSize: 7.2,
    color: MUTED,
    textDecoration: 'none',
  },
  headerRule: {
    height: 1,
    backgroundColor: HAIRLINE,
    marginTop: 14,
    marginBottom: 18,
  },
  body: {
    flexDirection: 'row',
    gap: 22,
  },
  mainCol: { flex: 1.75 },
  sideCol: {
    flex: 1,
    paddingLeft: 18,
    borderLeftWidth: 1,
    borderLeftColor: HAIRLINE,
  },
  section: { marginBottom: 14 },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  sectionTitleBar: {
    width: 14,
    height: 2,
    backgroundColor: ACCENT,
  },
  sectionTitle: {
    fontFamily: 'Albert Sans',
    fontWeight: 700,
    fontSize: 7.5,
    letterSpacing: 2,
    color: MUTED,
    textTransform: 'uppercase',
  },
  aboutText: {
    fontSize: 8.5,
    lineHeight: 1.6,
  },
  item: { marginBottom: 10 },
  itemTitle: {
    fontSize: 9.5,
    fontWeight: 600,
    color: INK,
  },
  itemMeta: {
    fontSize: 7,
    fontWeight: 500,
    letterSpacing: 0.6,
    color: MUTED,
    textTransform: 'uppercase',
    marginTop: 2.5,
  },
  itemPeriod: { color: ACCENT },
  itemDesc: {
    fontSize: 8,
    lineHeight: 1.55,
    marginTop: 4,
  },
  problemText: {
    fontSize: 8,
    lineHeight: 1.55,
    marginTop: 4,
    color: MUTED,
  },
  impactBullet: {
    fontSize: 8,
    lineHeight: 1.55,
    marginTop: 3,
  },
  impactLead: {
    fontWeight: 600,
    color: INK,
  },
  techRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 4,
  },
  itemTech: {
    fontSize: 6.8,
    fontWeight: 500,
    letterSpacing: 0.4,
    color: MUTED,
  },
  sideItem: { marginBottom: 9 },
  sideCategory: {
    fontSize: 7,
    fontWeight: 600,
    letterSpacing: 1,
    color: INK,
    textTransform: 'uppercase',
    marginBottom: 2.5,
  },
  sideText: {
    fontSize: 7.8,
    lineHeight: 1.55,
  },
  footer: {
    position: 'absolute',
    bottom: 24,
    left: 46,
    right: 46,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  footerText: {
    fontSize: 6.5,
    color: MUTED,
    letterSpacing: 0.8,
  },
});

export interface CvData {
  profile: Profile | null;
  timeline: TimelineEntry[];
  projects: CvProjectView[];
  technologies: Technology[];
  education: Education[];
  languages: Language[];
}

type Lang = 'es' | 'en';

const LABELS: Record<Lang, Record<string, string>> = {
  es: {
    profile: 'Perfil',
    experience: 'Experiencia',
    projects: 'Proyectos',
    skills: 'Habilidades',
    education: 'Educación',
    certifications: 'Certificaciones',
    languages: 'Idiomas',
  },
  en: {
    profile: 'Profile',
    experience: 'Experience',
    projects: 'Projects',
    skills: 'Skills',
    education: 'Education',
    certifications: 'Certifications',
    languages: 'Languages',
  },
};

function displayUrl(url: string): string {
  return url.replace(/^https?:\/\//, '').replace(/\/$/, '');
}

function SectionTitle({ children }: { children: string }) {
  return (
    <View style={styles.sectionTitleRow}>
      <View style={styles.sectionTitleBar} />
      <Text style={styles.sectionTitle}>{children}</Text>
    </View>
  );
}

function CvDocument({ data, lang }: { data: CvData; lang: Lang }) {
  const { profile, timeline, projects, technologies, education, languages } = data;
  const t = LABELS[lang];
  const isEs = lang === 'es';

  const experience = timeline.filter((e) => e.entry_type === 'work' || e.entry_type === 'freelance');
  const certifications = timeline.filter((e) => e.entry_type === 'certification');

  const skillGroups = new Map<string, string[]>();
  for (const tech of technologies) {
    const list = skillGroups.get(tech.category) ?? [];
    list.push(tech.name);
    skillGroups.set(tech.category, list);
  }

  const fullName = profile?.full_name ?? 'Edson Pedraza';
  const role = (isEs ? profile?.role_es : profile?.role_en) ?? 'Frontend Developer';
  const about = isEs ? profile?.about_es : profile?.about_en;

  return (
    <Document
      title={`CV — ${fullName}`}
      author={fullName}
      subject={role}
      creator="edsonpedraza.com"
    >
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.nameBlock}>
            <Text style={styles.name}>{fullName}</Text>
            <Text style={styles.role}>{role}</Text>
          </View>
          <View style={styles.contactBlock}>
            {profile?.email && (
              <Link src={`mailto:${profile.email}`} style={styles.contactLine}>{profile.email}</Link>
            )}
            {profile?.phone && <Text style={styles.contactLine}>{profile.phone}</Text>}
            {(isEs ? profile?.location_es : profile?.location_en) && (
              <Text style={styles.contactLine}>{isEs ? profile?.location_es : profile?.location_en}</Text>
            )}
            {profile?.github_url && (
              <Link src={profile.github_url} style={styles.contactLine}>{displayUrl(profile.github_url)}</Link>
            )}
            {profile?.linkedin_url && (
              <Link src={profile.linkedin_url} style={styles.contactLine}>{displayUrl(profile.linkedin_url)}</Link>
            )}
          </View>
        </View>
        <View style={styles.headerRule} />

        {/* Two-column body */}
        <View style={styles.body}>
          {/* Main column */}
          <View style={styles.mainCol}>
            {about && (
              <View style={styles.section}>
                <SectionTitle>{t.profile}</SectionTitle>
                <Text style={styles.aboutText}>{about}</Text>
              </View>
            )}

            {experience.length > 0 && (
              <View style={styles.section}>
                <SectionTitle>{t.experience}</SectionTitle>
                {experience.map((entry, i) => (
                  <View key={i} style={styles.item} wrap={false}>
                    <Text style={styles.itemTitle}>{isEs ? entry.role_es : entry.role_en}</Text>
                    <Text style={styles.itemMeta}>
                      {entry.company}
                      {'  ·  '}
                      <Text style={styles.itemPeriod}>{entry.year}</Text>
                    </Text>
                    {(isEs ? entry.description_es : entry.description_en) && (
                      <Text style={styles.itemDesc}>{isEs ? entry.description_es : entry.description_en}</Text>
                    )}
                  </View>
                ))}
              </View>
            )}

            {projects.length > 0 && (
              <View style={styles.section}>
                <SectionTitle>{t.projects}</SectionTitle>
                {projects.map((project, i) => (
                  <View key={i} style={styles.item} wrap={false}>
                    <Text style={styles.itemTitle}>{project.title}</Text>
                    {project.description && (
                      <Text style={styles.itemDesc}>{project.description}</Text>
                    )}
                    {project.problem && (
                      <Text style={styles.problemText}>{project.problem}</Text>
                    )}
                    {project.impact.map((bullet, j) => (
                      <Text key={j} style={styles.impactBullet}>
                        {bullet.lead && <Text style={styles.impactLead}>{bullet.lead}</Text>}
                        {bullet.lead && bullet.body ? '  ' : ''}
                        {bullet.body}
                      </Text>
                    ))}
                    {project.tech && project.tech.length > 0 && (
                      <View style={styles.techRow}>
                        {project.tech.map((tech, j) => (
                          <Text key={j} style={styles.itemTech}>
                            {tech}
                            {j < project.tech.length - 1 ? '  ·  ' : ''}
                          </Text>
                        ))}
                      </View>
                    )}
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* Side column */}
          <View style={styles.sideCol}>
            {skillGroups.size > 0 && (
              <View style={styles.section}>
                <SectionTitle>{t.skills}</SectionTitle>
                {Array.from(skillGroups.entries()).map(([category, skills], i) => (
                  <View key={i} style={styles.sideItem} wrap={false}>
                    <Text style={styles.sideCategory}>{category}</Text>
                    <Text style={styles.sideText}>{skills.join(', ')}</Text>
                  </View>
                ))}
              </View>
            )}

            {education.length > 0 && (
              <View style={styles.section}>
                <SectionTitle>{t.education}</SectionTitle>
                {education.map((item, i) => (
                  <View key={i} style={styles.sideItem} wrap={false}>
                    <Text style={[styles.sideText, { fontWeight: 600, color: INK }]}>
                      {isEs ? item.degree_es : item.degree_en}
                    </Text>
                    <Text style={styles.sideText}>{item.institution}</Text>
                    <Text style={[styles.sideText, { color: ACCENT, fontSize: 7 }]}>{item.period}</Text>
                  </View>
                ))}
              </View>
            )}

            {certifications.length > 0 && (
              <View style={styles.section}>
                <SectionTitle>{t.certifications}</SectionTitle>
                {certifications.map((entry, i) => (
                  <View key={i} style={styles.sideItem} wrap={false}>
                    <Text style={[styles.sideText, { fontWeight: 600, color: INK }]}>
                      {isEs ? entry.role_es : entry.role_en}
                    </Text>
                    <Text style={styles.sideText}>
                      {entry.company}
                      {'  ·  '}
                      {entry.year}
                    </Text>
                  </View>
                ))}
              </View>
            )}

            {languages.length > 0 && (
              <View style={styles.section}>
                <SectionTitle>{t.languages}</SectionTitle>
                {languages.map((item, i) => (
                  <View key={i} style={styles.sideItem} wrap={false}>
                    <Text style={styles.sideText}>
                      <Text style={{ fontWeight: 600, color: INK }}>{isEs ? item.name_es : item.name_en}</Text>
                      {(isEs ? item.level_es : item.level_en) ? ` — ${isEs ? item.level_es : item.level_en}` : ''}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>edsonpedraza.com</Text>
          <Text
            style={styles.footerText}
            render={({ pageNumber, totalPages }) => (totalPages > 1 ? `${pageNumber} / ${totalPages}` : '')}
          />
        </View>
      </Page>
    </Document>
  );
}

export async function renderCvPdf(data: CvData, lang: Lang): Promise<Buffer> {
  return renderToBuffer(<CvDocument data={data} lang={lang} />);
}
