import { AdminLoginInfos } from "../../model/admin.model";

export const isAdminUser = (adminLoginInfos: AdminLoginInfos): boolean => {
    return !!adminLoginInfos?.token?.trim();
}