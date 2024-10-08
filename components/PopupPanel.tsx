import * as React from "react";
import { useMutation } from '@tanstack/react-query';
import '../app/globals.css';
import { useRouter } from 'next/router';
import { apiRequest } from "@/lib/faircompute";

interface RequestData {
    node_id: string;
    cpus: number;
    gpus: number;
    dram: number;
    disk: number;
    public_ip: boolean;
}

interface ResponseData {
    executor_id: string;
}

interface PopupPanelProps {
    isOpen: boolean;
    onClose: () => void;
    gpuName: string;
    price: string;
    nodeId: string;
    gpus: number;
    cpucores: number;
    totalCpus: number;
    dram: number;
    totalRam: number;
    avail_gpus: number;
}

export const createExecutor = async (requestData: RequestData): Promise<ResponseData> => {
    const data = requestData;
  
    const response = await apiRequest<{ data: ResponseData }>("/api/v1/marketplace/providers/nodes/rent", true, data);
    return response.data;
};
  
const useCreateExecutor = () => {
    return useMutation<ResponseData, Error, RequestData>({
        mutationFn: createExecutor,
    });
};

function PopupPanel({ isOpen, onClose, gpuName, price, nodeId, gpus, cpucores, totalCpus, dram, totalRam, avail_gpus }: PopupPanelProps) {
    const [gpuQuantity, setGpuQuantity] = React.useState<number>(avail_gpus > 0 ? 1 : 0);
    const [cpuCores, setCpuCores] = React.useState<number>(0);
    const [ram, setRam] = React.useState<number>(0);


    const extractPrice = (priceString: string): number => {
        const match = priceString.match(/[\d.]+/); // Extract numeric value
        return match ? parseFloat(match[0]) : 0;
    };

    const initialPrice = extractPrice(price);

    const [totalPrice, setTotalPrice] = React.useState<number>(initialPrice);


    const [showMyPodPanel, setShowMyPodPanel] = React.useState(false);
    const [isRented, setIsRented] = React.useState(false);
    const { mutate, isPending, isError, data } = useCreateExecutor();
    const router = useRouter();

    React.useEffect(() => {
        console.log("useEffect triggered");

        let calculatedCpuCores: number;
        let calculatedRam: number;
        const parsedPrice = extractPrice(price);


        if (isNaN(parsedPrice)) {
            return;
        }

        if (gpuQuantity > 0 && gpus > 0) {
            calculatedCpuCores = Math.floor((gpuQuantity * totalCpus) / gpus);
            calculatedRam = Math.floor((gpuQuantity * totalRam) / gpus);
        } else {
            calculatedCpuCores = cpuCores;
            calculatedRam = Math.floor((cpuCores * totalRam) / totalCpus);
        }

        setCpuCores(calculatedCpuCores > cpucores ? cpucores : calculatedCpuCores);
        setRam(calculatedRam > dram ? dram : calculatedRam);

        const newTotalPrice = gpuQuantity * parsedPrice;
        console.log("New total price after calculation in useEffect:", newTotalPrice);
        setTotalPrice(newTotalPrice); // Use parsedPrice for calculation

    }, [gpuQuantity, gpus, cpucores, dram, cpuCores, price, totalCpus, totalRam]);

    const handleSubmit = () => {
        const requestData: RequestData = {
            node_id: nodeId,
            cpus: cpuCores,
            gpus: gpuQuantity,
            dram: ram * (1024 * 1024 * 1024), // Convert GB to bytes
            disk: 0,
            public_ip: false,
        };

        mutate(requestData);
        setIsRented(true);

        setTimeout(() => {
            setShowMyPodPanel(true);
        }, 3000);
    };

    React.useEffect(() => {
        if (showMyPodPanel) {
            const timer = setTimeout(() => {
                router.push('/pods');
            }, 1000);

            return () => clearTimeout(timer);
        }
    }, [showMyPodPanel, router]);

    if (!isOpen) {
        return null;
    }

    if (isRented) {
        return (
            <div className="fixed inset-y-0 right-0 flex flex-col justify-center w-full max-w-sm p-6 bg-[#1C1C1C] shadow-lg">
                <div className="absolute top-8 left-4">
                    <button className="text-white" onClick={onClose}>
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                    </button>
                </div>

                <div className="relative flex items-center justify-center w-full h-64 ">
                    <p className="absolute left-0 ml-4 text-white">0</p>
                    <img src="/renting.svg" alt="Rented GPU" className="w-4/5 h-auto" />
                    <p className="absolute right-0 mr-4 text-white">{gpuQuantity}</p>
                </div>
                <p className="mt-4 text-white text-md">Renting Executor Now!</p>
                <div className="mt-8 w-64 h-2 bg-gray-700 rounded-full">
                    <div className="h-full w-full bg-blue-500 rounded-full animate-pulse"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-y-0 right-0 flex flex-col justify-center w-full max-w-sm p-6 bg-[#1C1C1C] shadow-lg">
            <button className="absolute top-4 right-4 text-white hover:text-zinc-300" onClick={onClose}>
                <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>

            <div className="flex items-center justify-start px-3 py-2 bg-[#292929] mb-6 mt-8 rounded-lg ">
                <img loading="lazy" src="/mask-group.svg" className="w-7 h-7 mr-2" alt="USA Flag" />
                <p className="text-md font-bold text-white">{gpuName}</p>
                <p className="ml-auto text-sm text-blue-500">${!isNaN(totalPrice) ? totalPrice.toFixed(2) : 'N/A'}</p>
            </div>

            <div className="flex flex-col w-full space-y-4 ">
                {gpuName !== "None" && (
                    <div className="px-4 py-2 bg-[#292929] rounded-lg">
                        <p className="mb-2 text-xs text-white">Choose GPU Quantity</p>
                        <div className="flex items-center justify-between p-1 bg-neutral-800 rounded-md">
                            <input
                                type="range"
                                min="0"
                                max={avail_gpus}
                                step="1"
                                value={gpuQuantity}
                                onChange={(e) => setGpuQuantity(Number(e.target.value))}
                                className="w-full h-2 bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-[#191970]"
                            />
                            <span className="ml-4 text-white">{gpuQuantity}</span>
                        </div>
                    </div>
                )}
                {gpuName === "None" && (
                    <div className="px-3 py-2 bg-[#292929] rounded-lg">
                        <p className="mb-2 text-xs text-white">Choose CPU Cores</p>
                        <div className="flex items-center justify-between p-2 bg-neutral-800 rounded-md">
                            <input
                                type="range"
                                min="0"
                                max={cpucores}
                                step="1"
                                value={cpuCores}
                                onChange={(e) => setCpuCores(Number(e.target.value))}
                                className="w-full h-2 bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-[#191970]"
                            />
                            <span className="ml-4 text-white">{cpuCores}</span>
                        </div>
                    </div>
                )}
                {gpuName !== "None" && (
                    <div className="px-3 py-2 bg-[#292929] rounded-lg">
                        <p className="mb-2 text-xs text-white">CPU Cores</p>
                        <div className="flex items-center justify-between p-2 bg-neutral-800 rounded-md">
                            <span className="text-white">{cpuCores}</span>
                        </div>
                    </div>
                )}

                <div className="px-3 py-2 bg-[#292929] rounded-lg">
                    <p className="mb-2 text-xs text-white">RAM</p>
                    <div className="flex items-center justify-between p-2 bg-neutral-800 rounded-md">
                        <span className="text-white">{ram} GB</span>
                    </div>
                </div>
            </div>

            <div className="flex justify-end w-full gap-4 px-3 py-6 mt-auto max-md:flex-col max-md:items-stretch">
                <button className="px-6 py-2 text-sm font-medium text-white bg-neutral-800 border border-zinc-500 rounded-lg" onClick={onClose}>
                    Cancel
                </button>

                <button className="px-6 py-2 text-sm font-medium text-white bg-[#191970] rounded-lg" onClick={handleSubmit} disabled={isPending}>
                    {isPending ? "Renting GPU..." : "Rent GPU"}
                </button>
            </div>

            {isError && <p className="text-red-500">Error renting GPU. Please try again.</p>}
            {data && <p className="text-green-500">GPU rented successfully. Executor ID: {data.executor_id}</p>}
        </div>
    );
}

export default PopupPanel;
