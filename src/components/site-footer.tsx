import { Link } from "@tanstack/react-router";
import { ArrowUpRight, MessageCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { siteContentQuery } from "@/lib/queries";
import { whatsappLink } from "@/lib/site";
export function SiteFooter() {
  const { data } = useQuery(siteContentQuery);
  const footer = data?.footer?.published_from_admin === true ? data.footer as { blurb?: string; copyright?: string } : undefined;
  return (
    <footer className="studio-footer">
      <div className="ed-wrap">
        <div className="footer-top">
          <div>
            <p className="ed-kicker">Rajmoti Studio · Since 1982</p>
            <h2>
              For the moments
              <br />
              <em>you'll come back to.</em>
            </h2>
            <p>
              {footer?.blurb?.trim() || <>Photography, personal gifts and printed memories.<br />Made with care in Jetpur, Gujarat.</>}
            </p>
          </div>
          <div>
            <h3>Explore</h3>
            <Link to="/portfolios">Photography</Link>
            <Link to="/gifts">Photo gifting directory</Link>
            <Link to="/packages">Session collections</Link>
            <Link to="/stories">Our stories</Link>
          </div>
          <div>
            <h3>Visit & connect</h3>
            <Link to="/contact">
              Plan a studio visit <ArrowUpRight size={14} />
            </Link>
            <a href={whatsappLink()}>
              WhatsApp the studio <MessageCircle size={14} />
            </a>
            <a href="mailto:rajmotistudio@gmail.com">rajmotistudio@gmail.com</a>
            <p>Jetpur, Gujarat, India</p>
          </div>
        </div>
        <div className="footer-bottom">
          <span>{footer?.copyright?.trim() || `© ${new Date().getFullYear()} Rajmoti Studio`}</span>
          <Link to="/contact">ગુજરાતીમાં મદદ ઉપલબ્ધ છે</Link>
        </div>
      </div>
      <nav className="mobile-contact-dock" aria-label="Contact the studio">
        <a href={whatsappLink()}>
          <MessageCircle size={16} />
          WhatsApp
        </a>
        <Link to="/contact">
          Enquire <ArrowUpRight size={16} />
        </Link>
      </nav>
    </footer>
  );
}
