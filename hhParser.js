(function() {

var locationsArray = [];
var queryArray = [];
var experienceArray = [];

var aggregatedInfo = [];
var separatedInfo = [];

var activePagesCounter = 0;
var currentAddresses = [];

var aggregatedInfoText = {};
var separatedInfoText = {};
var errorInfoText = {};
var counterText = {};
var currentAddressesText = {};

var MAX_THREAD_COUNT = 50;

(function init() {
    locationsArray = [113, 1, 2, 4, 3, 66, 88, 78, 68, 104, 76, 99, 24, 54, 72, 26, 79, 53, 212, 11, 98, 95, 96, 35, 22, 112, 102, 29, 70, 1240, 90, 47, 77, 15, 71, 1641, 58, 92, 49, 107, 41, 56, 20, 84, 1399, 19, 32, 89, 17, 237, 1291];
    queryArray = ['Программист+java+not+"java+script"',
        'Программист+Objective-C',
        'Программист+C%2B%2B',
        'Программист+C%23',
        'Программист+PHP',
        'Программист+%28"Visual+Basic"+or+VBA%29+not+C%23',
        'Программист+Python',
        '"программист+javascript"+or+"программист+%28фронтенд+or+frontend%29"+or+"%28фронтенд+or+frontend%29+программист"+or+"программист+nodeJS"+or+"JavaScript+разработчик"+or+"nodeJS+программист"',
        'программист+(javascript+or+"java+script")',
        'Программист+Transact-SQL',
        'Программист+F%23',
        'Программист+Perl',
        'Программист+Ruby',
        'Программист+Delphi+or+"Object+Pascal"',
        'Программист+Lisp',
        'Программист+Go',
        'Программист+Assembly',
        'Программист+PL%2FSQL',
        'Программист+MATLAB',
        'Программист+SAS',
        'Программист+Shell',
        'Программист+Logo',
        'Программист+OpenEdge+ABL',
        'Программист+COBOL',
        'Программист+ABAP',
        'Программист+Fortran',
        'Программист+Lua',
        'Программист+ActionScript',
        'Программист+Ada',
        'Программист+Lisp',
        'Программист+Scratch',
        'Программист+Scala',
        'Программист+Tcl',
        'Программист+Prolog',
        'Программист+Haskell',
        'Программист+J%23',
        'Программист+%281С+or+1C%29',
        'Программист'];
    experienceArray = [0, 1, 2, 3];

    aggregatedInfoText = addNewTextArea('aggregated_text');
    separatedInfoText = addNewTextArea('separated_text');
    errorInfoText = addNewTextArea('error_info_text');
    counterText = addNewTextArea('page_counter_text');
    currentAddressesText = addNewTextArea('current_addresses_text');

    setTimeout(printCurrentAddresses, 60000);

    printAggregatedElement('city', 'experience', 'query', 'locationID', 'salary', 'vacancyCount', 'totalCount');
    printSeparatedElement('elementId', 'salary', 'city', 'experience', 'query', 'locationID', 'date');
})();

(function iterateAllFiles() {
    locationsArray.forEach(function(locationElement) {
        queryArray.forEach(function(queryElement) {
            if (experienceArray.length == 0) {
                processAddress(getFileAddress(locationElement, queryElement, ''));
            } else {
                experienceArray.forEach(function(experienceElement){
                    processAddress(getFileAddress(locationElement, queryElement, experienceElement));
                });
            }
        })
    });
    printResults();
})();

function getFileAddress(location, foundText, experience) {
    var addrTemplate1 = "http://spb.hh.ru/applicant/searchvacancyresult.xml?orderBy=0&compensationCurrencyCode=RUR&noMagic=true&searchPeriod=30&from=CLUSTER_EXPERIENCE&source=&text=&itemsOnPage=20&areaId=";
    var addrTemplate2 = "&specializationId=1.221&specializationId=1.420&specializationId=1.10&specializationId=1.110&specializationId=1.475&specializationId=1.474&specializationId=1.536&specializationId=1.9&specializationId=1.395&specializationId=1.50&specializationId=1.172&specializationId=1.274&specializationId=1.277&specializationId=1.295&specializationId=1.272&professionalAreaId=1&text=";
    var addrTemplate3 = "&experience=";
    return addrTemplate1 + location + addrTemplate2 + foundText + addrTemplate3 + experience;
}

function processAddress(address) {
    if (activePagesCounter > MAX_THREAD_COUNT) {
        setTimeout(processAddress, 5000, address);
        return;
    }

    ++activePagesCounter;
    currentAddresses.push(address);

    var getFunction = (function(address) {
        return function(data) {
            try {
                parsePage(data, address);
                startParsingNextPage(data);

                --activePagesCounter;
                deleteCurrentAddress(address);
            } catch (e) {
                addErrorReport('Exception at processing');
                --activePagesCounter;
            }
        }
    })(address);

    try {
        $.get(address, getFunction);
    } catch (e) {
        addErrorReport('Exception while GET at address ' + address);
        --activePagesCounter;
    }
}

function parsePage(data, address) {
    var params = getUrlVars(address);

    if (getPageNum(data) == 1) {
        parseAggregatedInfo(data, params);
    }

    parseSeparatedInfo(data, params);
}

function getPageNum(data) {
    var pageNum = $(data).find('.b-pager.m-pager_left-pager.HH-Pager ul li b').html();
    if (isNaN(pageNum)) {
        pageNum = 1;
    }

    return pageNum;
}

function parseAggregatedInfo(data, params) {
    var salaryInfo = {};

    salaryInfo.city = $(data).find('.clusters__item a').html().replace(/<span>×<\/span>|&nbsp;/g, '').trim();
    salaryInfo.experience = getParamFromURL(params, "experience");
    salaryInfo.query = $(data).find('#main-search-applicant').val();
    salaryInfo.locationID = getParamFromURL(params, "areaId");
    var s = $(data).find('.resumesearch__result strong').html();
    try{
        salaryInfo.totalCount = clearSalary(s);
    } catch (e) {
        // Не найдено ни одной вакансии
        salaryInfo.totalCount = 0;
    }

    salaryInfo.salaryExperienceArray = [];
    $(data).find('.clusters__item').each(function(index) {
        var salary = clearSalary('' + $(this).find('a').html()); if (isNaN(salary)) return;
        var vacancyCount = $(this).find('span').html();

        var salaryExperienceElement = {};
        salaryExperienceElement.salary = salary;
        salaryExperienceElement.vacancyCount = vacancyCount;

        salaryInfo.salaryExperienceArray.push(salaryExperienceElement);
        printAggregatedElement(salaryInfo.city, salaryInfo.experience, salaryInfo.query,
            salaryInfo.locationID, salary, vacancyCount, salaryInfo.totalCount);
    });

    aggregatedInfo.push(salaryInfo);
}

function clearSalary(str) {
    return str.replace(/(От |&nbsp;| руб.)/g, '');
}

function clearDate(str) {
    return str.replace(/(&nbsp;)/g, ' ');
}

function parseSeparatedInfo(data, params) {
    var city = $(data).find('.clusters__item a').html().replace(/<span>×<\/span>|&nbsp;/g, '').trim();
    var experience = getParamFromURL(params, "experience");
    var query = $(data).find('#main-search-applicant').val();
    var locationID = getParamFromURL(params, "areaId");

    var elements = $(data).find('.l-table.entry-content td.searchresult__cell.m-searchresult_standard>div,.l-table.entry-content td.searchresult__cell.m-searchresult__premium>div');
    elements.each(function(index, element) {
        var elementInfo = {};
        elementInfo.elementId = getElementId(element);
        elementInfo.salary = getSalaryForElement(element);
        elementInfo.date = clearDate($(element).find('.b-vacancy-list-date').html());

        elementInfo.city = city;
        elementInfo.experience = experience;
        elementInfo.query = query;
        elementInfo.locationID = locationID;

        separatedInfo.push(elementInfo);
        printSeparatedElement(elementInfo.elementId, elementInfo.salary, elementInfo.city,
            elementInfo.experience, elementInfo.query, elementInfo.locationID, elementInfo.date);
    });
}

function getSalaryForElement(element) {
    var str = $(element).find('.b-vacancy-list-salary').html();
    if ((str == undefined) || (str == "") || (str.indexOf('руб') < 0)) {
        return 0;
    }

    var salary = "";
    var minSalary = 0;
    var maxSalary = 0;

    if (str.indexOf("до") >= 0) {
        var maxSalaryStr = str.substr(str.indexOf("до"));
        if (maxSalaryStr != "") {
            maxSalary = maxSalaryStr.replace(/(до |&nbsp;| руб.)/g, '');
            str = str.substr(0, str.indexOf("до") - 1);
        }
    }

    if (str.indexOf("от") >= 0) {
        minSalary = str.replace(/(от |&nbsp;| руб.)/g, '').trim();
    }

    if (minSalary == 0) {minSalary = maxSalary;}
    if (maxSalary == 0) {maxSalary = minSalary;}

    return maxSalary/2 + minSalary/2;
}

function getElementId(element) {
    var str = $(element).find('.b-marker a').attr('href');
    str = str.substr(0, str.indexOf('?'));
    str = str.substr(str.lastIndexOf('/') + 1)
    return str;
}

    function getParamFromURL(URLParams, paramName) {
        if (URLParams[paramName] == undefined) {
            return -1;
        }

        return URLParams[paramName];
    }

function getUrlVars(href) {
    var vars = [], hash;
    var hashes = href.slice(href.indexOf('?') + 1).split('&');
    for (var i = 0; i < hashes.length; i++) {
        hash = hashes[i].split('=');
        vars.push(hash[0]);
        vars[hash[0]] = hash[1];
    }
    return vars;
}

function startParsingNextPage(data){
    var nextPageButton = $(data).find('a.b-pager__next-text.m-active-arrow.HH-Pager-Controls-Next');
    if (nextPageButton.length == 0) {
        return;
    }

    var nextPageAddress = nextPageButton.attr('href');
    processAddress(nextPageAddress);
}

function printResults() {
    counterText.append(activePagesCounter + '\n');

    if (activePagesCounter > 0) {
        console.log('active pages counter: ' + activePagesCounter);
        setTimeout(printResults, 3000);
        return;
    }

//    printAggregatedInfo();
//
//    console.log('---------------------------------------------------------------------------------------');
//
//    printSeparatedInfo();
}

function printAggregatedInfo() {
    var separator = ';';

    // заголовок
    console.log('city' + separator + 'experience' + separator + 'query' + separator +
        'locationID' + separator + 'salary' + separator + 'vacancyCount' + separator +
        'totalCount');

    aggregatedInfo.forEach(function(element) {
        var printAggregateElement = (function (city, experience, query, locationId) {
            return function(salary, vacancyCount) {
                console.log(city + separator + experience + query + separator + locationId + separator +
                    salary + separator + vacancyCount);
            }
        })(element.city, element.experience, element.query, element.locationID);

        element.salaryExperienceArray.forEach(function(salaryExperienceElement) {
            printAggregateElement(salaryExperienceElement.salary, salaryExperienceElement.vacancyCount);
        });
    });
}

function printSeparatedInfo() {
    var separator = ';';

    // заголовок
    console.log('elementId' + separator + 'salary' + separator +
        'city' + separator + 'experience' + separator + 'query' + separator + 'locationID');

    separatedInfo.forEach(function(elementInfo) {
       console.log(elementInfo.elementId + separator + elementInfo.salary + separator +
           elementInfo.city + separator + elementInfo.experience + separator + elementInfo.query +
           separator + elementInfo.locationID + separator + elementInfo.date);
    });
}

function addNewTextArea(textId) {
    var body = $('body').append('<textarea rows="15" id="' + textId + '"></textarea>');
    return $('#' + textId);
}

function printAggregatedElement(city, experience, query, locationID, salary, vacancyCount, totalCount) {
    var separator = ';';
    addTextToTextArea(aggregatedInfoText,
        city + separator + experience + separator + query + separator +
        locationID + separator + salary + separator + vacancyCount + separator + totalCount);
}

function printSeparatedElement(elementId, salary, city, experience, query, locationID, date) {
    var separator = ';';
    addTextToTextArea(separatedInfoText,
        elementId + separator + salary + separator + city + separator +
        experience + separator + query + separator + locationID + separator + date);
}

function addTextToTextArea(textArea, text) {
    text += '\n';
    textArea.append(text);
}

function addErrorReport(text) {
    addTextToTextArea(errorInfoText, text);
}

function printCurrentAddresses() {
    currentAddressesText.html('');
    currentAddressesText.append('Всего элементов: ' + currentAddresses.length + '\n');
    currentAddresses.forEach(function(currentAddress) {
       currentAddressesText.append(currentAddress + '\n');
    });
}

function deleteCurrentAddress(address) {
    var n;
    for (n = 0; n < currentAddresses.length; n++) {
        if (currentAddresses[n] == address) {
            currentAddresses.splice(n, 1);
            return;
        }
    }
}
})();