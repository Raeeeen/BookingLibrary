import { toast } from "react-toastify";

export const useToast = () => {
  const showToast = (
    message: string,
    type: "success" | "error" | "info" | "warning" = "info"
  ) => {
    toast[type](message);
  };

  return { showToast };
};
