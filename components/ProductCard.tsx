import Image from "next/image";
import Link from "next/link";
import type { PublicProduct } from "@/lib/catalog";

interface ProductCardProps {
  product: PublicProduct;
  priority?: boolean;
}

export function ProductCard({ product, priority = false }: ProductCardProps) {
  const imageSrc = product.images[0] || "/images/products/saas-launchpad.png";

  return (
    <article className="group flex flex-col overflow-hidden rounded-xl border border-stone-200 bg-white transition hover:border-stone-300 hover:shadow-sm">
      <Link
        href={`/products/${product.slug}`}
        className="relative block aspect-video w-full overflow-hidden bg-stone-100"
      >
        <Image
          src={imageSrc}
          alt={product.title}
          width={1200}
          height={675}
          priority={priority}
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]"
        />
      </Link>

      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-center justify-between gap-2 text-xs text-stone-600">
          {product.category ? (
            <Link
              href={`/category/${product.category.slug}`}
              className="font-medium text-emerald-800 hover:underline"
            >
              {product.category.name}
            </Link>
          ) : (
            <span className="font-medium text-stone-600">Source Code</span>
          )}
          <span className="font-mono text-stone-500">v{product.version}</span>
        </div>

        <h3 className="mt-2 text-base font-semibold leading-snug text-stone-950">
          <Link
            href={`/products/${product.slug}`}
            className="hover:text-emerald-800"
          >
            {product.title}
          </Link>
        </h3>

        <p className="mt-1.5 line-clamp-2 flex-1 text-sm leading-relaxed text-stone-600">
          {product.tagline}
        </p>

        <div className="mt-4 flex flex-wrap gap-1.5">
          {product.techStack.slice(0, 3).map((tech) => (
            <span
              key={tech}
              className="rounded-md bg-stone-100 px-2 py-0.5 font-mono text-xs text-stone-700"
            >
              {tech}
            </span>
          ))}
        </div>

        <div className="mt-5 flex items-center justify-between border-t border-stone-100 pt-4">
          <div className="text-sm text-stone-700">
            {product.ratingCount > 0 ? (
              <span>
                <span className="font-semibold text-stone-950">
                  ★ {product.ratingAverage.toFixed(1)}
                </span>{" "}
                <span className="text-stone-500">({product.ratingCount})</span>
              </span>
            ) : (
              <span className="text-stone-500">New release</span>
            )}
          </div>
          <span className="text-base font-bold text-stone-950">
            ${product.price}
          </span>
        </div>
      </div>
    </article>
  );
}
