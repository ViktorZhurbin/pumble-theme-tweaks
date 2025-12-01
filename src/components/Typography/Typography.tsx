import { type JSX, splitProps } from "solid-js";
import { Dynamic } from "solid-js/web";
import styles from "./Typography.module.css";

type TypographyVariant =
	| "default"
	| "body"
	| "caption"
	| "title"
	| "h4"
	| "h3"
	| "h2"
	| "h1";

type TypographyElement =
	| "h1"
	| "h2"
	| "h3"
	| "h4"
	| "h5"
	| "h6"
	| "p"
	| "span"
	| "div"
	| "label";

interface TypographyProps {
	as?: TypographyElement;
	variant?: TypographyVariant;
	children: JSX.Element;
	class?: string;
	// biome-ignore lint/suspicious/noExplicitAny: I'm ok with this
	[key: string]: any;
}

export function Typography(props: TypographyProps) {
	const [local, others] = splitProps(props, [
		"as",
		"variant",
		"class",
		"children",
	]);

	const element = local.as ?? "span";
	const variant = local.variant ?? "default";

	return (
		<Dynamic
			component={element}
			class={`${styles.base} ${styles[variant]} ${local.class ?? ""}`}
			{...others}
		>
			{local.children}
		</Dynamic>
	);
}
