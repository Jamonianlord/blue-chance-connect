import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User } from "lucide-react";

const cache = new Map<string, { url: string; expires: number }>();

async function getSignedUrl(bucket: string, path: string): Promise<string | null> {
  const key = `${bucket}/${path}`;
  const now = Date.now();
  const cached = cache.get(key);
  if (cached && cached.expires > now + 60_000) return cached.url;
  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, 3600);
  if (error || !data) return null;
  cache.set(key, { url: data.signedUrl, expires: now + 3600 * 1000 });
  return data.signedUrl;
}

type Props = {
  bucket: string;
  path: string | null | undefined;
  alt?: string;
  className?: string;
  onClick?: () => void;
  fallback?: React.ReactNode;
};

export function SignedImage({ bucket, path, alt = "", className, onClick, fallback }: Props) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    let cancelled = false;
    if (!path) { setUrl(null); return; }
    getSignedUrl(bucket, path).then((u) => { if (!cancelled) setUrl(u); });
    return () => { cancelled = true; };
  }, [bucket, path]);

  if (!path) return <>{fallback ?? null}</>;
  if (!url) return <div className={(className ?? "") + " animate-pulse bg-muted"} />;
  return <img src={url} alt={alt} className={className} onClick={onClick} loading="lazy" />;
}

export function Avatar({ path, name, size = 40, onClick, className, online }: {
  path: string | null | undefined;
  name?: string;
  size?: number;
  onClick?: () => void;
  className?: string;
  online?: boolean;
}) {
  const style = { width: size, height: size };
  const base = "inline-flex items-center justify-center rounded-full overflow-hidden bg-[var(--brand-soft)] text-[var(--brand)] font-semibold shrink-0 relative " + (className ?? "");
  if (path) {
    return (
      <div className={base} style={style} onClick={onClick}>
        <SignedImage bucket="profile-photos" path={path} alt={name ?? "avatar"} className="h-full w-full object-cover" />
        {online && <span className="absolute bottom-0 right-0 h-[25%] w-[25%] rounded-full border-2 border-background bg-green-500" />}
      </div>
    );
  }
  return (
    <div className={base} style={style} onClick={onClick}>
      {name ? <span style={{ fontSize: size * 0.4 }}>{name[0]?.toUpperCase()}</span> : <User style={{ width: size * 0.5, height: size * 0.5 }} />}
      {online && <span className="absolute bottom-0 right-0 h-[25%] w-[25%] rounded-full border-2 border-background bg-green-500" />}
    </div>
  );
}
