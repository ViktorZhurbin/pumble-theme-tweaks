import { type JSX, splitProps } from "solid-js";
import { Typography } from "@/components/Typography/Typography";
import styles from "./Button.module.css";

type ButtonVariant = "primary" | "secondary" | "error";

interface ButtonProps extends JSX.ButtonHTMLAttributes<HTMLButtonElement> {
	variant?: ButtonVariant;
	children: JSX.Element;
}

export function Button(props: ButtonProps) {
	const [local, others] = splitProps(props, ["variant", "class", "children"]);
	const variant = local.variant ?? "secondary";

	return (
		<button
			type="button"
			class={`${styles.button} ${styles[variant]} ${local.class ?? ""}`}
			{...others}
		>
			<Typography variant="caption">{local.children}</Typography>
		</button>
	);
}
