export function CourseConnectLogo({ className, ...props }: React.ImgHTMLAttributes<HTMLImageElement>) {
    return (
        <img 
            src="/pageicon.png?v=3"
            alt="CourseConnect Logo"
            className={className}
            {...props}
        />
    )
}
