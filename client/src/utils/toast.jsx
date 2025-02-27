import React from 'react';
import { toast, ToastContainer as ReactToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const defaultOptions = {
    position: "top-center",
    autoClose: 3000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
    progress: undefined,
};

const toastTypes = {
    success: {
        className: "bg-green-50 border-l-4 border-green-500 text-green-800",
    },
    error: {
        className: "bg-red-50 border-l-4 border-red-500 text-red-800",
    },
    warning: {
        className: "bg-amber-50 border-l-4 border-amber-500 text-amber-800",
    },
    info: {
        className: "bg-blue-50 border-l-4 border-blue-500 text-blue-800",
    },
};

const ToastContent = ({ message, type }) => {
    const { icon } = toastTypes.info;

    return (
        <div className="flex items-center gap-3">
            {icon}
            <span className="font-medium">{message}</span>
        </div>
    );
};

export const showSuccessToast = (message, options = {}) => {
    return toast.success(
        <ToastContent message={message} type="success" />,
        { ...defaultOptions, ...options }
    );
};

export const showErrorToast = (message, options = {}) => {
    return toast.error(
        <ToastContent message={message} type="error" />,
        { ...defaultOptions, ...options }
    );
};

export const showWarningToast = (message, options = {}) => {
    return toast.warning(
        <ToastContent message={message} type="warning" />,
        { ...defaultOptions, ...options }
    );
};

export const showInfoToast = (message, options = {}) => {
    return toast.info(
        <ToastContent message={message} type="info" />,
        { ...defaultOptions, ...options }
    );
};

export const showCustomToast = (message, options = {}) => {
    return toast(message, { ...defaultOptions, ...options });
};

export const ToastContainer = () => (
    <ReactToastContainer
        position="top-center"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
        toastClassName={({ type }) =>
            `${toastTypes[type]?.className || ''} relative flex p-3 min-h-10 rounded-md justify-between overflow-hidden cursor-pointer my-2 shadow-md`
        }
    />
);

export default {
    showSuccessToast,
    showErrorToast,
    showWarningToast,
    showInfoToast,
    showCustomToast,
    ToastContainer,
};