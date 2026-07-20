import { useNavigate, useLocation, useParams as useReactParams, useSearchParams as useReactSearchParams } from 'react-router-dom';

export function useRouter() {
  const navigate = useNavigate();
  return {
    push: (href: string) => navigate(href),
    replace: (href: string) => navigate(href, { replace: true }),
    back: () => navigate(-1),
    forward: () => navigate(1),
    refresh: () => window.location.reload(),
    prefetch: () => {},
  };
}

export function usePathname() {
  const location = useLocation();
  return location.pathname;
}

export function useParams() {
  return useReactParams();
}

export function useSearchParams() {
  const [searchParams] = useReactSearchParams();
  return searchParams;
}

export function redirect(url: string) {
  window.location.replace(url);
  return null as never;
}
